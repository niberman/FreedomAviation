import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { DEMO_AIRCRAFT } from "@/lib/demo-data";

interface InvoiceLine {
  id?: string;
  description: string;
  quantity: number;
  unit_cents: number;
}

interface OwnerInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  category?: string;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
  invoice_lines: InvoiceLine[];
  [key: string]: unknown;
}

export function useOwnerMore() {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const invoiceId = searchParams.get("invoice_id");

    if (paymentStatus === "success" && invoiceId) {
      toast({ title: "Payment Successful", description: "Your invoice payment has been processed successfully." });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.replace("/dashboard/more");
    } else if (paymentStatus === "cancelled") {
      toast({ title: "Payment Cancelled", description: "Your payment was cancelled.", variant: "destructive" });
      router.replace("/dashboard/more");
    }
  }, [searchParams, toast, queryClient, router]);

  const { data: aircraftList } = useQuery({
    queryKey: ["aircraft", "owner-list", isDemo ? "demo" : user?.id],
    enabled: isDemo || Boolean(user?.id),
    queryFn: async () => {
      if (isDemo) return [DEMO_AIRCRAFT];
      if (!user?.id) return [];
      const { data, error } = await supabase.from("aircraft").select("*").eq("owner_id", user.id);
      if (error) throw error;
      return data || [];
    },
  });

  const aircraft = aircraftList?.[0] ?? null;

  const { data: serviceRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["service-requests", isDemo ? "demo" : user?.id, aircraft?.id],
    enabled: isDemo || Boolean(user?.id && aircraft?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_SERVICE_REQUESTS } = await import("@/lib/demo-data");
        return DEMO_SERVICE_REQUESTS;
      }
      if (!user?.id || !aircraft?.id) return [];
      const { data } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("aircraft_id", aircraft.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<OwnerInvoice[]>({
    queryKey: ["invoices", aircraft?.id, isDemo ? "demo" : user?.id],
    enabled: isDemo || Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_INVOICES } = await import("@/lib/demo-data");
        return DEMO_INVOICES.map((inv: Record<string, unknown>) => {
          const lineItems = inv.line_items as Array<{ description: string; quantity: number; unit_price: number }> | undefined;
          return {
            ...inv,
            invoice_lines: lineItems?.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unit_cents: Math.round(item.unit_price * 100),
            })) || [],
          } as OwnerInvoice;
        });
      }
      if (!aircraft?.id || !user?.id) return [];
      const { data } = await supabase
        .from("invoices")
        .select('*, invoice_lines(id, description, quantity, unit_cents)')
        .eq("aircraft_id", aircraft.id)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      return (data || []).map((inv: Record<string, unknown>) => ({
        ...inv,
        invoice_lines: Array.isArray(inv.invoice_lines)
          ? (inv.invoice_lines as InvoiceLine[]).map((line) => ({
              id: line.id,
              description: line.description,
              quantity: Number(line.quantity),
              unit_cents: Number(line.unit_cents),
            }))
          : [],
      } as OwnerInvoice));
    },
  });

  return {
    isDemo,
    serviceRequests,
    isLoadingRequests,
    invoices: invoices as Array<{
      id: string;
      invoice_number: string;
      amount: number;
      status: string;
      category?: string;
      due_date: string | null;
      paid_date: string | null;
      created_at: string;
      invoice_lines?: Array<{ description: string; quantity: number; unit_cents: number }>;
    }>,
    invoicesLoading,
  };
}
