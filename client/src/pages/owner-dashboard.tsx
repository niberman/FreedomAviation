import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuickActions } from "@/features/owner/components/QuickActions";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { DEMO_AIRCRAFT, DEMO_USER } from "@/lib/demo-data";
import logoImage from "@assets/freedom-aviation-logo.png";

export default function OwnerDashboard() {
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


  const { data: membership = null } = useQuery({
    queryKey: ["membership", isDemo ? "demo" : user?.id],
    enabled: isDemo || Boolean(user?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_MEMBERSHIP } = await import("@/lib/demo-data");
        return DEMO_MEMBERSHIP;
      }
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching membership:", error);
        return null;
      }
      
      return data;
    },
  });


  const readinessTypes = [
    "readiness",
    "clean",
    "detail",
    "oil",
    "o2",
    "tks",
    "db_update",
  ];
  
  const hasOpenTask = serviceTasks.some(
    (task) =>
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      readinessTypes.some((type) => task.type.toLowerCase().includes(type))
  );

  const readinessStatus = hasOpenTask ? "Needs Service" : "Ready";
  const readinessVariant = hasOpenTask ? "destructive" : "default";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {isDemo && <DemoBanner />}
      
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">Owner Dashboard</h2>
        <p className="text-muted-foreground">Welcome back to Freedom Aviation</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <CardTitle className="text-base font-medium">My Aircraft</CardTitle>
          <img src={logoImage} alt="Freedom Aviation" className="h-6 w-auto opacity-50" />
        </CardHeader>
        <CardContent>
          {aircraft ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold" data-testid="text-tail-number">{aircraft.tail_number}</div>
                  <p className="text-sm text-muted-foreground">{aircraft.model}</p>
                  <p className="text-xs text-muted-foreground">Base: {aircraft.base_location}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Hobbs Time</p>
                  <p className="text-xl font-semibold">
                    {aircraft.hobbs_hours ? `${aircraft.hobbs_hours.toFixed(1)} hrs` : 'N/A'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tach Time</p>
                  <p className="text-xl font-semibold">
                    {aircraft.tach_hours ? `${aircraft.tach_hours.toFixed(1)} hrs` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {membership && (
                  <Badge variant="secondary" data-testid="badge-membership">
                    {membership.tier}
                  </Badge>
                )}
                <Badge variant={readinessVariant as any} data-testid="badge-readiness">
                  {readinessStatus}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No aircraft assigned</div>
          )}
        </CardContent>
      </Card>

      {aircraft && (user || isDemo) && (
        <QuickActions 
          aircraftId={aircraft.id} 
          userId={isDemo ? DEMO_USER.id : user!.id}
          aircraftData={aircraft}
          isDemo={isDemo}
        />
      )}
    </div>
  );
}
