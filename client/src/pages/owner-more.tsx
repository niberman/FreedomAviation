import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Plane } from "lucide-react";
import { CreditsOverview } from "@/components/owner/CreditsOverview";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { DEMO_AIRCRAFT } from "@/lib/demo-data";

export default function OwnerMore() {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();

  const { data: aircraftList } = useQuery({
    queryKey: ["/api/aircraft", { ownerId: isDemo ? "demo" : user?.id }],
    enabled: isDemo || Boolean(user?.id),
    queryFn: async () => {
      if (isDemo) return [DEMO_AIRCRAFT];
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("aircraft")
        .select("*")
        .eq("owner_id", user.id);
      
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
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("aircraft_id", aircraft.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) {
        console.error("Error fetching service requests:", error);
        return [];
      }
      
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
      
      const { data, error } = await supabase
        .from("service_tasks")
        .select("*")
        .eq("aircraft_id", aircraft.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) {
        console.error("Error fetching service tasks:", error);
        return [];
      }
      
      return data.map((task) => ({
        id: task.id,
        aircraft_id: task.aircraft_id,
        type: task.type,
        status: task.status,
        assigned_to: task.assigned_to,
        notes: task.notes,
        photos: Array.isArray(task.photos) ? task.photos.filter((p): p is string => typeof p === 'string') : [],
        completed_at: task.completed_at,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", aircraft?.id, isDemo ? "demo" : user?.id],
    enabled: isDemo || Boolean(aircraft?.id && user?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_INVOICES } = await import("@/lib/demo-data");
        return DEMO_INVOICES;
      }
      if (!aircraft?.id || !user?.id) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("aircraft_id", aircraft.id)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) {
        console.error("Error fetching invoices:", error);
        return [];
      }
      
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Freedom Aviation</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {isDemo && <DemoBanner />}
        
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">More Details</h2>
          <p className="text-muted-foreground">Additional information and options</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BillingCard invoices={invoices} isLoading={invoicesLoading} />
          <DocsCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServiceTimeline 
            tasks={serviceTasks} 
            requests={serviceRequests}
            isLoading={tasksLoading} 
          />
        </div>

        <CreditsOverview />
      </main>
    </div>
  );
}
