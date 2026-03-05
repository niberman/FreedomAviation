import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiJson } from "@/lib/api-client";

interface UseResendInvoiceOptions {
  invalidateQueryKeys?: Array<readonly unknown[]>;
}

export function useResendInvoice(options?: UseResendInvoiceOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!invoiceId) {
        throw new Error("Missing invoice id");
      }
      return apiJson<{ message?: string }>('/api/invoices/send-email', {
        method: "POST",
        body: JSON.stringify({ invoiceId }),
      });
    },
    onSuccess: async () => {
      console.log("[Invoice] Resend: success");
      await queryClient.invalidateQueries({ queryKey: ["cfi-invoices"] });

      for (const queryKey of options?.invalidateQueryKeys || []) {
        await queryClient.invalidateQueries({ queryKey: [...queryKey] });
      }

      toast({
        title: "Invoice email sent",
        description: "Invoice was sent to the client again.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to resend invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
