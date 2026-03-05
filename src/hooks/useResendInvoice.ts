import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

interface UseResendInvoiceOptions {
  invalidateQueryKeys?: Array<readonly unknown[]>;
}

function getInvoiceEmailApiUrl() {
  if (typeof window === "undefined") {
    return "/api/invoices/send-email";
  }

  if (window.location.hostname === "freedomaviationco.com") {
    return "https://www.freedomaviationco.com/api/invoices/send-email";
  }

  return `${window.location.origin}/api/invoices/send-email`;
}

export function useResendInvoice(options?: UseResendInvoiceOptions) {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!invoiceId) {
        throw new Error("Missing invoice id");
      }
      const authToken = session?.access_token;
      if (!authToken) {
        throw new Error("Not authenticated. Please log in.");
      }

      const response = await fetch(getInvoiceEmailApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ invoiceId }),
      });

      let payload: any = null;
      const text = await response.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { message: text };
        }
      }

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || "Failed to resend invoice email");
      }

      return payload;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/cfi/invoices"] });

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
