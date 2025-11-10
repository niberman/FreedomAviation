import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickActions } from "@/features/owner/components/QuickActions";
import { DemoBanner } from "@/components/DemoBanner";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { DEMO_AIRCRAFT, DEMO_USER } from "@/lib/demo-data";
import logoImage from "@assets/falogo.png";
import { Link, useLocation } from "wouter";
import { ArrowRight, Home } from "lucide-react";
import { EditableField } from "@/components/owner/EditableField";
import { useAircraft } from "@/lib/hooks/useAircraft";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isStaffRole } from "@/lib/roles";
import { DashboardLayout } from "@/components/dashboard/layout";
import { ownerDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Check if user is staff and redirect them
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !isDemo,
    retry: false,
  });

  const isStaff = isStaffRole(userProfile?.role ?? null);

  // Redirect staff users to staff dashboard
  useEffect(() => {
    if (!isDemo && user && userProfile && isStaff) {
      setLocation('/staff');
    }
  }, [user, userProfile, isStaff, isDemo, setLocation]);
  
  // Use hooks for editing
  const { aircraftList: hookAircraftList, updateAircraft } = useAircraft();
  
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
        photos: Array.isArray(task.photos) ? task.photos.filter((p: any): p is string => typeof p === 'string') : [],
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

  const queryClient = useQueryClient();
  
  const handleAircraftUpdate = async (field: string, value: string | number | null) => {
    if (!aircraft?.id || isDemo) return;
    
    try {
      await updateAircraft.mutateAsync({
        id: aircraft.id,
        data: { [field]: value },
      });
      
      // Explicitly invalidate the owner dashboard's aircraft query
      queryClient.invalidateQueries({ 
        queryKey: ["/api/aircraft", { ownerId: isDemo ? "demo" : user?.id }] 
      });
      
      toast({
        title: "Aircraft updated",
        description: "Your aircraft information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating aircraft:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update aircraft";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      // Re-throw error so EditableField can keep the editor open
      throw error;
    }
  };
  return (
    <DashboardLayout
      title="Owner Dashboard"
      description="Welcome back to Freedom Aviation"
      navItems={ownerDashboardNavItems}
      titleTestId="text-dashboard-title"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      }
    >
      {isDemo && <DemoBanner />}

      <Card>
        <CardHeader className="flex flex-col items-start gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-medium">My Aircraft</CardTitle>
          <Link href="/" data-testid="link-home-from-logo">
            <img
              src={logoImage}
              alt="Freedom Aviation"
              className="h-6 w-auto opacity-50 transition-opacity hover:opacity-80"
            />
          </Link>
        </CardHeader>
        <CardContent>
          {aircraft ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Tail Number</div>
                  <div className="text-xl sm:text-2xl font-bold truncate" data-testid="text-tail-number">
                    {aircraft.tail_number}
                  </div>
                  {!isDemo && (
                    <>
                      <EditableField
                        value={aircraft.make}
                        onSave={(value) => handleAircraftUpdate("make", value)}
                        label="Make"
                        placeholder="e.g., Cirrus"
                        className="text-sm"
                      />
                      <EditableField
                        value={aircraft.model}
                        onSave={(value) => handleAircraftUpdate("model", value)}
                        label="Model"
                        placeholder="e.g., SR22T"
                        className="text-sm"
                      />
                      <EditableField
                        value={aircraft.year}
                        onSave={(value) => handleAircraftUpdate("year", value !== null && value !== "" ? Number(value) : null)}
                        label="Year"
                        type="number"
                        format={(v) => v?.toString() || "N/A"}
                        parse={(v) => v === "" || v === null ? null : Number(v)}
                        placeholder="2024"
                        className="text-sm"
                      />
                      <EditableField
                        value={aircraft.base_location}
                        onSave={(value) => handleAircraftUpdate("base_location", value)}
                        label="Base Location"
                        placeholder="e.g., KAPA"
                        className="text-xs"
                      />
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <EditableField
                    value={aircraft.hobbs_hours}
                    onSave={(value) => handleAircraftUpdate("hobbs_hours", value !== null && value !== "" ? Number(value) : null)}
                    label="Hobbs Time"
                    type="number"
                    format={(v) => v !== null && v !== undefined ? `${Number(v).toFixed(1)} hrs` : "N/A"}
                    parse={(v) => v === "" || v === null ? null : Number(v)}
                    placeholder="0.0"
                    disabled={isDemo}
                    className="text-xl font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <EditableField
                    value={aircraft.tach_hours}
                    onSave={(value) => handleAircraftUpdate("tach_hours", value !== null && value !== "" ? Number(value) : null)}
                    label="Tach Time"
                    type="number"
                    format={(v) => v !== null && v !== undefined ? `${Number(v).toFixed(1)} hrs` : "N/A"}
                    parse={(v) => v === "" || v === null ? null : Number(v)}
                    placeholder="0.0"
                    disabled={isDemo}
                    className="text-xl font-semibold"
                  />
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
      {aircraft === null && (hookAircraftList.isLoading || aircraftList === undefined) && (
        <div className="p-4 animate-pulse text-muted-foreground text-sm">Loading aircraft information…</div>
      )}

      {aircraft && (user || isDemo) && (
        <QuickActions 
          aircraftId={aircraft.id} 
          userId={isDemo ? DEMO_USER.id : user!.id}
          aircraftData={aircraft}
          isDemo={isDemo}
        />
      )}

      <div className="flex justify-center pt-4">
        <Link href="/dashboard/more">
          <Button variant="outline" size="lg" data-testid="button-view-more">
            View More Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </DashboardLayout>
  );
}
