import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { InstructionInvoice } from "@/types/invoices";
import { useToast } from "@/hooks/use-toast";

const isDev = process.env.NODE_ENV !== 'production';

export function useInvoices() {
  const { user } = useAuth();
  const { canSeeAllInvoices } = useUserProfile();

  return useQuery<InstructionInvoice[]>({
    queryKey: ['/api/cfi/invoices', user?.id, isDev, canSeeAllInvoices],
    queryFn: async () => {
      if (!user && isDev) return [];
      if (!user) throw new Error('Not authenticated');

      // Build the query - try nested query first
      // Include both instruction and maintenance invoices (exclude membership which is handled separately)
      let query = supabase
        .from('invoices')
        .select(`
          *,
          aircraft:aircraft_id(tail_number),
          owner:owner_id(full_name, email),
          invoice_lines(description, quantity, unit_cents)
        `)
        .in('category', ['instruction', 'maintenance']);

      // Staff/Admin see all invoices, CFIs see only their own
      if (!canSeeAllInvoices) {
        query = query.eq('created_by_cfi_id', user.id);
      }

      let { data, error } = await query.order('created_at', { ascending: false });
      
      // If nested query fails, try fetching separately
      if (error && (error.message?.includes('invoice_lines') || error.message?.includes('aircraft') || error.message?.includes('owner'))) {
        let baseQuery = supabase
          .from('invoices')
          .select('*')
          .in('category', ['instruction', 'maintenance']);

        if (!canSeeAllInvoices) {
          baseQuery = baseQuery.eq('created_by_cfi_id', user.id);
        }

        const invoicesResult = await baseQuery.order('created_at', { ascending: false });
        
        if (invoicesResult.error) {
          throw invoicesResult.error;
        }

        const invoiceData = invoicesResult.data || [];
        if (invoiceData.length === 0) return [];

        const invoiceIds = invoiceData.map((inv: any) => inv.id);
        const aircraftIds = [...new Set(invoiceData.map((inv: any) => inv.aircraft_id))];
        const ownerIds = [...new Set(invoiceData.map((inv: any) => inv.owner_id))];
        
        // Fetch related data separately
        const [linesResult, aircraftResult, ownerResult] = await Promise.all([
          invoiceIds.length > 0 
            ? supabase.from('invoice_lines').select('*').in('invoice_id', invoiceIds)
            : { data: [], error: null },
          aircraftIds.length > 0
            ? supabase.from('aircraft').select('id, tail_number').in('id', aircraftIds)
            : { data: [], error: null },
          ownerIds.length > 0
            ? supabase.from('user_profiles').select('id, full_name, email').in('id', ownerIds)
            : { data: [], error: null },
        ]);
        
        // Combine data
        const linesByInvoiceId = (linesResult.data || []).reduce((acc: any, line: any) => {
          if (!acc[line.invoice_id]) acc[line.invoice_id] = [];
          acc[line.invoice_id].push(line);
          return acc;
        }, {});
        
        const aircraftById = (aircraftResult.data || []).reduce((acc: any, ac: any) => {
          acc[ac.id] = ac;
          return acc;
        }, {});
        
        const ownerById = (ownerResult.data || []).reduce((acc: any, owner: any) => {
          acc[owner.id] = owner;
          return acc;
        }, {});
        
        return invoiceData.map((inv: any) => ({
          ...inv,
          aircraft: aircraftById[inv.aircraft_id] || null,
          owner: ownerById[inv.owner_id] || null,
          invoice_lines: linesByInvoiceId[inv.id] || []
        }));
      }

      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDeleteInvoice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfi/invoices'] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting invoice",
        description: error.message || "An error occurred while deleting the invoice.",
        variant: "destructive",
      });
    }
  });
}

interface UpdateInvoiceParams {
  invoiceId: string;
  description?: string;
  flightDate?: string;
  hours?: number;
  rateCents?: number;
  notes?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unit_cents: number;
    type?: 'labor' | 'part' | 'fee';
  }>;
}

export function useUpdateInvoice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: UpdateInvoiceParams) => {
      if (!user) throw new Error('Not authenticated');
      const { invoiceId, lineItems, ...invoiceUpdates } = params;

      // 1. Update invoice details if provided
      if (Object.keys(invoiceUpdates).length > 0) {
        // Map local params to DB columns if needed, or handle logic here
        // For instruction invoices, description/hours/rate might be stored in lines or description field
        // But here we assume we update the invoice metadata or specific fields
        // For simplicity in this hook, we might need to handle instruction vs maintenance differences
        // But let's focus on the common fields first.
        
        // Special handling: if updating description for instruction invoice, we might need to update the invoice description
        const updates: any = {};
        if (invoiceUpdates.notes !== undefined) updates.notes = invoiceUpdates.notes;
        // If we are updating amount, it usually comes from lines, so we might not update it directly unless it's a manual override
        
        if (Object.keys(updates).length > 0) {
            const { error } = await supabase
            .from('invoices')
            .update(updates)
            .eq('id', invoiceId);
            if (error) throw error;
        }
      }

      // 2. Update line items if provided
      if (lineItems) {
        // First delete existing lines (simplest approach for full update)
        // Or we could try to diff them. Deleting and re-inserting is often safer for simple line items.
        const { error: deleteError } = await supabase
          .from('invoice_lines')
          .delete()
          .eq('invoice_id', invoiceId);
        
        if (deleteError) throw deleteError;

        // Insert new lines
        const { error: insertError } = await supabase
          .from('invoice_lines')
          .insert(lineItems.map(item => ({
            invoice_id: invoiceId,
            description: item.description,
            quantity: item.quantity,
            unit_cents: item.unit_cents
          })));

        if (insertError) throw insertError;

        // Recalculate total
        const totalCents = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_cents), 0);
        const { error: updateAmountError } = await supabase
            .from('invoices')
            .update({ amount: totalCents / 100.0 })
            .eq('id', invoiceId);
        
        if (updateAmountError) throw updateAmountError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfi/invoices'] });
      toast({
        title: "Invoice updated",
        description: "The invoice has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating invoice",
        description: error.message || "An error occurred while updating the invoice.",
        variant: "destructive",
      });
    }
  });
}
