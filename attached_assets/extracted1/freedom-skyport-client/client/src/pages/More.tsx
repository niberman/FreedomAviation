import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { CreditsOverview } from "@/components/owner/CreditsOverview";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function More() {
  const { user } = useAuth();
  
  const { data: aircraftList } = useQuery({
    queryKey: ["/api/aircraft"],
    enabled: Boolean(user?.id),
  });
  
  const aircraft = aircraftList && (aircraftList as any[]).length > 0 ? (aircraftList as any[])[0] : null;

  const { data: serviceRequests = [] } = useQuery({
    queryKey: ["/api/service-requests"],
    enabled: Boolean(user?.id),
  });

  const { data: serviceTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/service-tasks", { aircraftId: aircraft?.id }],
    enabled: Boolean(aircraft?.id && user?.id),
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: Boolean(user?.id),
  });

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild data-testid="button-back-to-dashboard">
              <a href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </a>
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-more-title">More Details</h2>
          <p className="text-muted-foreground">Service timeline, billing, documents, and credits</p>
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
          <Card data-testid="card-placeholder-features">
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium text-foreground">Upcoming Reservations</p>
                  <p className="text-xs mt-1">View and manage your flight reservations</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium text-foreground">Maintenance Due</p>
                  <p className="text-xs mt-1">Track upcoming maintenance requirements</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium text-foreground">Pilot Currency</p>
                  <p className="text-xs mt-1">Monitor your currency and ratings status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <CreditsOverview />
      </div>
    </Layout>
  );
}
