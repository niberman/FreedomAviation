import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Plane, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickActions } from "@/features/owner/components/QuickActions";

export default function OwnerDashboard() {
  const { user } = useAuth();
  
  const { data: aircraftList } = useQuery({
    queryKey: ["/api/aircraft"],
    enabled: Boolean(user?.id),
  });
  
  const aircraft = aircraftList && (aircraftList as any[]).length > 0 ? (aircraftList as any[])[0] : null;

  const { data: membership = null } = useQuery({
    queryKey: ["/api/memberships"],
    enabled: Boolean(user?.id),
  });

  const { data: serviceTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/service-tasks", { aircraftId: aircraft?.id }],
    enabled: Boolean(aircraft?.id && user?.id),
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
  
  const hasOpenTask = (serviceTasks as any[]).some(
    (task: any) =>
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      readinessTypes.some((type) => task.type.toLowerCase().includes(type))
  );

  const readinessStatus = hasOpenTask ? "Needs Service" : "Ready";
  const readinessVariant = hasOpenTask ? "destructive" : "default";

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">Owner Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to Freedom Aviation</p>
        </div>

        <Card data-testid="card-your-aircraft">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xl font-semibold">Your Aircraft</CardTitle>
            <Plane className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {aircraft ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold" data-testid="text-tail-number">{aircraft.tail_number}</div>
                    <p className="text-sm text-muted-foreground" data-testid="text-aircraft-model">{aircraft.model}</p>
                    <p className="text-xs text-muted-foreground" data-testid="text-base-location">Base: {aircraft.base_location}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Hobbs Time</p>
                    <p className="text-xl font-semibold" data-testid="text-hobbs-time">
                      {aircraft.hobbs_time ? `${aircraft.hobbs_time.toFixed(1)} hrs` : 'N/A'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tach Time</p>
                    <p className="text-xl font-semibold" data-testid="text-tach-time">
                      {aircraft.tach_time ? `${aircraft.tach_time.toFixed(1)} hrs` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {membership && (
                    <Badge variant="secondary" data-testid={`badge-membership-${(membership as any).tier}`}>
                      {(membership as any).tier}
                    </Badge>
                  )}
                  <Badge variant={readinessVariant as any} data-testid="badge-readiness-status">
                    {readinessStatus}
                  </Badge>
                </div>

                {aircraft && user && (
                  <div className="pt-4 border-t">
                    <QuickActions 
                      aircraftId={aircraft.id} 
                      userId={user.id}
                      aircraftData={aircraft}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground" data-testid="text-no-aircraft">No aircraft assigned</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-more-info">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <Wrench className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">Need More Information?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View service timeline, billing, documents, and more
                </p>
              </div>
              <Button variant="outline" asChild data-testid="button-view-more">
                <a href="/more">View More Details</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
