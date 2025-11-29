import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { InstructionInvoice } from "@/types/invoices";

const isDev = !import.meta.env.PROD;

export function useInvoices() {
  const { user } = useAuth();
  const { canSeeAllInvoices } = useUserProfile();

  return useQuery<InstructionInvoice[]>({
    queryKey: ['/api/cfi/invoices', user?.id, isDev, canSeeAllInvoices],
    queryFn: async () => {
      if (!user && isDev) return [];
      if (!user) throw new Error('Not authenticated');

      // Build the query - try nested query first
      let query = supabase
        .from('invoices')
        .select(`
          *,
          aircraft:aircraft_id(tail_number),
          owner:owner_id(full_name, email),
          invoice_lines(description, quantity, unit_cents)
        `)
        .eq('category', 'instruction');

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
          .eq('category', 'instruction');

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

