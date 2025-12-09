'use client';

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/layout";
import { ownerDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { DollarSign, Plane } from "lucide-react";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";
import { PasswordChangeCard } from "@/features/owner/components/PasswordChangeCard";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { DEMO_AIRCRAFT } from "@/lib/demo-data";

export default function OwnerMore() {
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
    queryKey: ["/api/aircraft", { ownerId: isDemo ? "demo" : user?.id }],
    enabled: isDemo || Boolean(user?.id),
    queryFn: async () => {
      if (isDemo) return [DEMO_AIRCRAFT];
      if (!user?.id) return [];
      const { data, error } = await supabase.from("aircraft").select("*").eq("owner_id", user.id);
      if (error) throw error;
      return data || [];
    }
  });
  
  const aircraft = aircraftList && aircraftList.length > 0 ? aircraftList[0] : null;

  const { data: serviceRequests = [] } = useQuery({
    queryKey: ["service-requests", isDemo ? "demo" : user?.id, aircraft?.id],
    enabled: isDemo || Boolean(user?.id && aircraft?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_SERVICE_REQUESTS } = await import("@/lib/demo-data");
        return DEMO_SERVICE_REQUESTS;
      }
      if (!user?.id || !aircraft?.id) return [];
      const { data } = await supabase.from("service_requests").select("*").eq("user_id", user.id).eq("aircraft_id", aircraft.id).order("created_at", { ascending: false }).limit(20);
      return data || [];
    }
  });

  const { data: serviceTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["service-tasks", aircraft?.id],
    enabled: isDemo || Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_SERVICE_TASKS } = await import("@/lib/demo-data");
        return DEMO_SERVICE_TASKS;
      }
      if (!aircraft?.id) return [];
      const { data } = await supabase.from("service_tasks").select("*").eq("aircraft_id", aircraft.id).order("created_at", { ascending: false }).limit(10);
      return (data || []).map((task: any) => ({
        ...task,
        photos: Array.isArray(task.photos) ? task.photos.filter((p: any): p is string => typeof p === 'string') : [],
      }));
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", aircraft?.id, isDemo ? "demo" : user?.id],
    enabled: isDemo || Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_INVOICES } = await import("@/lib/demo-data");
        return DEMO_INVOICES.map((inv: any) => ({
          ...inv,
          invoice_lines: inv.line_items?.map((item: any) => ({
            description: item.description, quantity: item.quantity, unit_cents: Math.round(item.unit_price * 100),
          })) || [],
        }));
      }
      if (!aircraft?.id || !user?.id) return [];
      const { data } = await supabase.from("invoices").select(`*, invoice_lines(id, description, quantity, unit_cents)`).eq("aircraft_id", aircraft.id).eq("owner_id", user.id).order("created_at", { ascending: false }).limit(6);
      return (data || []).map((inv: any) => ({
        ...inv,
        invoice_lines: Array.isArray(inv.invoice_lines) ? inv.invoice_lines.map((line: any) => ({
          id: line.id, description: line.description, quantity: Number(line.quantity), unit_cents: Number(line.unit_cents),
        })) : [],
      }));
    },
  });

  return (
    <DashboardLayout title="Operations & Billing" description="Manage your account, billing, and service history." navItems={ownerDashboardNavItems} actions={<ThemeToggle />}>
      {isDemo && <DemoBanner />}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Billing & Invoices</h3>
        </div>
        <BillingCard invoices={invoices} isLoading={invoicesLoading} />
      </section>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Service History</h3>
        </div>
        <ServiceTimeline tasks={serviceTasks} requests={serviceRequests} isLoading={tasksLoading} />
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Account & Settings</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PasswordChangeCard />
          <DocsCard />
        </div>
      </section>
    </DashboardLayout>
  );
}

