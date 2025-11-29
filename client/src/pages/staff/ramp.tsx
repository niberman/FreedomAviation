import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { RampJobCard } from "@/components/ops/ramp-job-card";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plane, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ServiceRequestEditDialog } from "@/components/service-request-edit-dialog";
import { ServiceRequest } from "@/shared/supabase-types";

type ServiceRequestWithRelations = ServiceRequest & {
  aircraft?: {
    tail_number: string;
  };
  owner?: {
    full_name?: string;
    email?: string;
  };
};

export default function RampOperations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Fetch service requests
  const { 
    data: serviceRequests = [], 
    refetch: refetchServiceRequests, 
    error: serviceRequestsError, 
    isLoading: isLoadingServiceRequests 
  } = useQuery({
    queryKey: ['/api/service-requests/ramp'],
    queryFn: async (): Promise<ServiceRequestWithRelations[]> => {
      try {
        // First, try to fetch service requests with nested relations
        let query = supabase
          .from('service_requests')
          .select(`
            *,
            aircraft:aircraft_id(tail_number),
            owner:user_id(full_name, email)
          `)
          .order('created_at', { ascending: false });

        let { data, error } = await query;
        
        // If nested query fails, try fetching separately
        if (error && (error.message?.includes('aircraft') || error.message?.includes('owner') || error.message?.includes('user_profiles'))) {
          console.warn('Nested query failed, trying separate queries:', error.message);
          
          // Fetch service requests without nested relations
          const srResult = await supabase
            .from('service_requests')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (srResult.error) {
            console.error('Error fetching service requests:', srResult.error);
            throw srResult.error;
          }
          
          const srData = srResult.data || [];
          
          // Get unique aircraft and user IDs
          const aircraftIds = [...new Set(srData.map((sr: any) => sr.aircraft_id).filter(Boolean))];
          const userIds = [...new Set(srData.map((sr: any) => sr.user_id).filter(Boolean))];
          
          // Fetch aircraft and owners separately
          const [aircraftResult, ownersResult] = await Promise.all([
            aircraftIds.length > 0
              ? supabase
                  .from('aircraft')
                  .select('id, tail_number')
                  .in('id', aircraftIds)
              : { data: [], error: null },
            userIds.length > 0
              ? supabase
                  .from('user_profiles')
                  .select('id, full_name, email')
                  .in('id', userIds)
              : { data: [], error: null },
          ]);
          
          // Create maps for quick lookup
          const aircraftMap = (aircraftResult.data || []).reduce((acc: any, ac: any) => {
            acc[ac.id] = { tail_number: ac.tail_number };
            return acc;
          }, {});
          
          const ownersMap = (ownersResult.data || []).reduce((acc: any, owner: any) => {
            acc[owner.id] = { full_name: owner.full_name, email: owner.email };
            return acc;
          }, {});
          
          // Combine data
          data = srData.map((sr: any) => ({
            ...sr,
            aircraft: aircraftMap[sr.aircraft_id] || null,
            owner: ownersMap[sr.user_id] || null,
          }));
          
          error = null; // Clear error since we successfully fetched
        }
        
        if (error) {
          console.error('Error fetching service requests:', error);
          throw error;
        }
        
        return data || [];
      } catch (err: any) {
        console.error('Error in service requests query:', err);
        // Provide more helpful error message
        if (err.message?.includes('permission') || err.code === 'PGRST301') {
          throw new Error('Permission denied. Please check your authentication and ensure you have admin or staff role.');
        } else if (err.message?.includes('relation') || err.code === 'PGRST116') {
          throw new Error('Service requests table not found. Please ensure the database schema is set up correctly.');
        } else {
          throw err;
        }
      }
    },
    // Refetch every 30 seconds to catch new requests
    refetchInterval: 30000,
    enabled: Boolean(user),
  });

  const handleMarkStaged = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Aircraft Staged",
        description: "Service request marked as completed.",
      });

      await refetchServiceRequests();
    } catch (error) {
      console.error('Error updating service request:', error);
      toast({
        title: "Error",
        description: "Failed to update service request status.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsEditDialogOpen(true);
  };

  // Filter requests by status
  const pendingRequests = serviceRequests.filter(
    (req) => req.status === 'pending' || req.status === 'in_progress'
  );
  const completedRequests = serviceRequests.filter(
    (req) => req.status === 'completed'
  );

  const selectedRequest = serviceRequests.find(req => req.id === selectedRequestId);

  return (
    <DashboardLayout
      title="Ramp Operations"
      description="Mobile Task List for Ground Crew"
      navItems={staffDashboardNavItems}
      actions={<ThemeToggle />}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Plane className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Ramp Task List</h1>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="gap-2">
              <span>Pending</span>
              <Badge variant="secondary" className="ml-auto">
                {pendingRequests.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Completed</span>
              <Badge variant="secondary" className="ml-auto">
                {completedRequests.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {isLoadingServiceRequests ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading tasks...</p>
                </CardContent>
              </Card>
            ) : serviceRequestsError ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-destructive font-medium mb-2">Error loading tasks</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {serviceRequestsError instanceof Error ? serviceRequestsError.message : 'Unknown error occurred'}
                  </p>
                </CardContent>
              </Card>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">All caught up!</p>
                  <p className="text-sm text-muted-foreground">
                    No pending service requests at this time.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <RampJobCard
                    key={request.id}
                    request={request}
                    onMarkStaged={handleMarkStaged}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-4">
            {completedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No completed tasks yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedRequests.map((request) => (
                  <RampJobCard
                    key={request.id}
                    request={request}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Details Dialog */}
      {selectedRequest && (
        <ServiceRequestEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          serviceRequest={{
            id: selectedRequest.id,
            aircraftId: selectedRequest.aircraft_id,
            userId: selectedRequest.user_id,
            serviceType: selectedRequest.service_type,
            priority: selectedRequest.priority || undefined,
            description: selectedRequest.description,
            status: selectedRequest.status,
            airport: selectedRequest.airport || undefined,
            requestedDeparture: selectedRequest.requested_departure || undefined,
            fuelGrade: selectedRequest.fuel_grade || undefined,
            fuelQuantity: selectedRequest.fuel_quantity || undefined,
            o2Topoff: selectedRequest.o2_topoff || undefined,
            tksTopoff: selectedRequest.tks_topoff || undefined,
            gpuRequired: selectedRequest.gpu_required || undefined,
            hangarPullout: selectedRequest.hangar_pullout || undefined,
            createdAt: selectedRequest.created_at,
            updatedAt: selectedRequest.updated_at,
          }}
          onSave={() => {
            setIsEditDialogOpen(false);
            refetchServiceRequests();
          }}
        />
      )}
    </DashboardLayout>
  );
}

