import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CreateInvoiceParams {
  ownerId: string;
  aircraftId: string;
  description: string;
  flightDate: string;
  hours: string;
  ratePerHour: string;
}

interface LineItem {
  type: 'labor' | 'part' | 'fee';
  description: string;
  quantity: number;
  rateCents: number;
}

interface CreateMaintenanceInvoiceParams {
  ownerId: string;
  aircraftId: string;
  notes: string;
  lineItems: LineItem[];
}

export function useCreateInvoice() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateInvoiceParams) => {
      const { ownerId, aircraftId, description, flightDate, hours, ratePerHour } = params;
      
      if (!user) throw new Error('Not authenticated');

      const rateCents = Math.round(parseFloat(ratePerHour) * 100);
      const hoursDecimal = parseFloat(hours);

      // Convert "__none__" to null for optional aircraft
      const finalAircraftId = aircraftId === "__none__" || !aircraftId ? null : aircraftId;
      
      const { data: invoiceData, error: createError } = await supabase.rpc('create_instruction_invoice', {
        p_owner_id: ownerId,
        p_aircraft_id: finalAircraftId,
        p_description: `${description} - ${flightDate}`,
        p_hours: hoursDecimal,
        p_rate_cents: rateCents,
        p_cfi_id: user.id,
      });

      if (createError) throw createError;
      if (!invoiceData) throw new Error('Invoice creation failed');

      const invoiceId = invoiceData;

      // Finalize the invoice
      const { error: finalizeError } = await supabase.rpc('finalize_invoice', {
        p_invoice_id: invoiceId,
      });
      if (finalizeError) throw finalizeError;

      // Send email to client
      try {
        let apiUrl: string;
        if (window.location.hostname === "freedomaviationco.com") {
          apiUrl = "https://www.freedomaviationco.com/api/invoices/send-email";
        } else {
          apiUrl = `${window.location.origin}/api/invoices/send-email`;
        }
        const authToken = session?.access_token;
        if (!authToken) throw new Error("Not authenticated. Please log in.");

        const emailResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          credentials: "include",
          body: JSON.stringify({ invoiceId }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          let error: any;
          try {
            error = JSON.parse(errorText);
          } catch {
            error = { error: errorText || "Unknown error" };
          }
          
          const errorMessage = error.message || error.error || "Unknown error";
          
          if (errorMessage.includes('sent')) {
            toast({
              title: "Invoice already sent",
              description: "This invoice has already been sent to the client.",
            });
          } else {
            toast({
              title: "Invoice created",
              description: `Invoice created, but email failed: ${errorMessage}`,
              variant: "destructive",
            });
          }
        } else {
          const result = await emailResponse.json();
          if (result.emailService === "console" || result.sent === false) {
            toast({
              title: "Invoice created",
              description: "Email service in console mode. Logged to server console.",
            });
          }
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        toast({
          title: "Invoice created",
          description: "Error sending email. Check server logs.",
          variant: "destructive",
        });
      }

      return invoiceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfi/invoices'] });
      toast({
        title: "Invoice sent",
        description: "Invoice has been created and sent to the client.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

// Hook for creating maintenance invoices with multiple line items
export function useCreateMaintenanceInvoice() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateMaintenanceInvoiceParams) => {
      const { ownerId, aircraftId, notes, lineItems } = params;
      
      if (!user) throw new Error('Not authenticated');

      // Convert "__none__" to null for optional aircraft
      const finalAircraftId = aircraftId === "__none__" || !aircraftId ? null : aircraftId;
      
      // Format line items for the RPC (unit_cents instead of rateCents)
      const formattedLineItems = lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_cents: item.rateCents,
      }));

      const { data: invoiceData, error: createError } = await supabase.rpc('create_maintenance_invoice', {
        p_owner_id: ownerId,
        p_aircraft_id: finalAircraftId,
        p_notes: notes || '',
        p_line_items: formattedLineItems,
        p_created_by: user.id,
      });

      if (createError) throw createError;
      if (!invoiceData) throw new Error('Invoice creation failed');

      const invoiceId = invoiceData;

      // Finalize the invoice (reuse existing RPC)
      const { error: finalizeError } = await supabase.rpc('finalize_invoice', {
        p_invoice_id: invoiceId,
      });
      if (finalizeError) throw finalizeError;

      // Send email to client (reuse existing endpoint)
      try {
        let apiUrl: string;
        if (window.location.hostname === "freedomaviationco.com") {
          apiUrl = "https://www.freedomaviationco.com/api/invoices/send-email";
        } else {
          apiUrl = `${window.location.origin}/api/invoices/send-email`;
        }
        const authToken = session?.access_token;
        if (!authToken) throw new Error("Not authenticated. Please log in.");

        const emailResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          credentials: "include",
          body: JSON.stringify({ invoiceId }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          let error: any;
          try {
            error = JSON.parse(errorText);
          } catch {
            error = { error: errorText || "Unknown error" };
          }
          
          const errorMessage = error.message || error.error || "Unknown error";
          
          if (errorMessage.includes('sent')) {
            toast({
              title: "Invoice already sent",
              description: "This invoice has already been sent to the client.",
            });
          } else {
            toast({
              title: "Invoice created",
              description: `Invoice created, but email failed: ${errorMessage}`,
              variant: "destructive",
            });
          }
        } else {
          const result = await emailResponse.json();
          if (result.emailService === "console" || result.sent === false) {
            toast({
              title: "Invoice created",
              description: "Email service in console mode. Logged to server console.",
            });
          }
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        toast({
          title: "Invoice created",
          description: "Error sending email. Check server logs.",
          variant: "destructive",
        });
      }

      return invoiceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cfi/invoices'] });
      toast({
        title: "Invoice sent",
        description: "Maintenance invoice has been created and sent to the client.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

