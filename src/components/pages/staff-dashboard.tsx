'use client';

import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Wrench, Plane, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { KanbanBoard } from "@/components/staff/kanban-board";
import { AircraftTable } from "@/components/staff/aircraft-table";
import { ClientsTable } from "@/components/staff/clients-table";
import { ServiceRequestEditDialog } from "@/components/staff/service-request-edit-dialog";
import { StaffManagement } from "@/components/staff/staff-management";
import { MaintenanceCRUD } from "@/components/staff/maintenance-crud";
import { useClients } from "@/hooks/useClients";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAircraftTable } from "@/hooks/useAircraft";

// Valid tab values for the management console
const VALID_TABS = [
  "requests", "aircraft", "maintenance", "clients", "staff"
] as const;

type TabValue = typeof VALID_TABS[number];

export function StaffDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get tab from URL query parameter
  const tabFromUrl = searchParams.get("tab");
  
  // Validate and set initial tab
  const initialTab: TabValue = tabFromUrl && VALID_TABS.includes(tabFromUrl as TabValue) 
    ? (tabFromUrl as TabValue) 
    : "requests";
  
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  
  // Sync tab state with URL parameter changes
  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as TabValue)) {
      setActiveTab(tabFromUrl as TabValue);
    }
  }, [tabFromUrl]);

  const { isAdmin } = useUserProfile();

  // Fetch owners
  const { data: owners = [], isLoading: isLoadingOwners, error: ownersError } = useClients();

  // Log owners data and show error toast if needed
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/ce595c44-18a7-46d2-b583-275de660c288',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'99c487'},body:JSON.stringify({sessionId:'99c487',location:'staff-dashboard.tsx:ownersEffect',message:'Owners useEffect fired',data:{hasOwnersError:!!ownersError,ownersErrorMsg:ownersError instanceof Error ? ownersError.message : String(ownersError),ownersLength:(owners||[]).length,isLoadingOwners,ownersIsArray:Array.isArray(owners)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (owners && owners.length > 0) {
      console.log('Available owners:', owners.length);
    } else if (!isLoadingOwners && owners.length === 0) {
      console.warn('No owners found in database');
    }
    
    if (ownersError) {
      toast({
        title: 'Error loading clients',
        description: ownersError instanceof Error ? ownersError.message : 'Failed to load clients.',
        variant: 'destructive',
      });
    }
  }, [owners, isLoadingOwners, ownersError, toast]);

  const { aircraftFull, isLoading: isLoadingAircraft, error: aircraftError } = useAircraftTable();

  // Handle aircraft loading errors
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/ce595c44-18a7-46d2-b583-275de660c288',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'99c487'},body:JSON.stringify({sessionId:'99c487',location:'staff-dashboard.tsx:aircraftEffect',message:'Aircraft error useEffect fired',data:{hasAircraftError:!!aircraftError,aircraftErrorMsg:aircraftError instanceof Error ? aircraftError.message : String(aircraftError)},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (aircraftError) {
      console.error('Aircraft query error:', aircraftError);
      toast({
        title: 'Error loading aircraft',
        description: aircraftError instanceof Error ? aircraftError.message : 'Failed to load aircraft.',
        variant: 'destructive',
      });
    }
  }, [aircraftError, toast]);

  // Fetch service requests for kanban board
  const { data: serviceRequests = [], refetch: refetchServiceRequests, error: serviceRequestsError, isLoading: isLoadingServiceRequests } = useQuery({
    queryKey: ['service-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          service_type,
          requested_departure,
          requested_date,
          requested_time,
          description,
          notes,
          status,
          priority,
          airport,
          created_at,
          aircraft_id,
          user_id,
          aircraft:aircraft_id(tail_number),
          owner:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    retry: 3,
    enabled: !!user,
  });

  // Handle service request status change
  const handleStatusChange = async (requestId: string, status: "pending" | "in_progress" | "completed") => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({ 
        title: 'Status updated', 
        description: `Service request status changed to ${status}` 
      });
      
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    } catch (error) {
      console.error('Error updating service request status:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to update status', 
        variant: 'destructive' 
      });
      throw error;
    }
  };

  // Handle service request card selection
  const handleCardSelect = (requestId: string) => {
    const request = serviceRequests.find((sr: any) => sr.id === requestId);
    if (request) {
      setSelectedServiceRequest(request);
      setIsEditDialogOpen(true);
    }
  };

  // Handle service requests loading errors
  useEffect(() => {
    if (serviceRequestsError) {
      console.error('Service requests query error:', serviceRequestsError);
      toast({
        title: 'Error loading service requests',
        description: serviceRequestsError instanceof Error ? serviceRequestsError.message : 'Failed to load service requests. Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  }, [serviceRequestsError, toast]);

  // Fetch maintenance items
  const { data: maintenanceItems = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select(`
          id,
          aircraft_id,
          item_name,
          due_date,
          due_hobbs,
          status,
          aircraft:aircraft_id(tail_number)
        `)
        .order('due_date', { ascending: true });
      if (error) throw error;
      
      if (data && data.length > 0) {
        const aircraftIds = [...new Set(data.map((m: any) => m.aircraft_id).filter(Boolean))];
        const { data: aircraftData } = await supabase
          .from('aircraft')
          .select('id, hobbs_hours')
          .in('id', aircraftIds);
        
        const hobbsMap = (aircraftData || []).reduce((acc: any, ac: any) => {
          acc[ac.id] = ac.hobbs_hours;
          return acc;
        }, {});
        
        return data.map((m: any) => ({
          ...m,
          item: m.item_name,
          due_at_date: m.due_date,
          due_at_hours: m.due_hobbs,
          severity: m.status === 'overdue' ? 'critical' : m.status === 'due_soon' ? 'warning' : 'info',
          aircraft: m.aircraft ? {
            ...m.aircraft,
            hobbs_hours: hobbsMap[m.aircraft_id] || null
          } : null
        }));
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Image
                  src="/images/falogo.png"
                  alt="Freedom Aviation"
                  width={32}
                  height={32}
                  className="h-8 w-auto transition-opacity hover:opacity-80"
                  style={{ width: 'auto' }}
                />
              </Link>
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Staff Management Console</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/staff')}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard Home
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Site
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Management Console</h2>
            <p className="text-muted-foreground">Complete tools for managing all aspects of aviation operations</p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-1">
              <TabsTrigger value="requests" className="text-xs sm:text-sm">Service Requests</TabsTrigger>
              <TabsTrigger value="aircraft" className="text-xs sm:text-sm">Aircraft</TabsTrigger>
              <TabsTrigger value="maintenance" className="text-xs sm:text-sm">Maintenance</TabsTrigger>
              <TabsTrigger value="clients" className="text-xs sm:text-sm">Clients</TabsTrigger>
              <TabsTrigger value="staff" className="text-xs sm:text-sm">Staff</TabsTrigger>
            </TabsList>

          {/* Service Requests */}
          <TabsContent value="requests" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-semibold">Service Requests</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage service requests from aircraft owners
                </p>
              </div>
              {serviceRequests.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {serviceRequests.length} total
                </Badge>
              )}
            </div>
            {isLoadingServiceRequests ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading service requests...</p>
                </CardContent>
              </Card>
            ) : serviceRequestsError ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-destructive font-medium mb-2">Error loading service requests</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {serviceRequestsError instanceof Error ? serviceRequestsError.message : 'Unknown error occurred'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchServiceRequests()}
                    >
                      Retry
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : serviceRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No service requests yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Service requests from owners will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <KanbanBoard 
                  items={serviceRequests
                    .filter((sr: any) => sr && sr.id)
                    .map((sr: any) => {
                      const statusMap: Record<string, 'new' | 'in_progress' | 'done'> = {
                        'pending': 'new',
                        'in_progress': 'in_progress',
                        'completed': 'done',
                        'cancelled': 'done',
                      };
                      
                      let requestedFor = 'TBD';
                      if (sr.requested_departure) {
                        const date = new Date(sr.requested_departure);
                        requestedFor = format(date, 'MMM d, yyyy HH:mm');
                      } else if (sr.airport) {
                        requestedFor = sr.airport;
                      }
                      
                      const displayNotes = sr.description || '';
                      
                      return {
                        id: sr.id,
                        tailNumber: sr.aircraft?.tail_number || 'N/A',
                        type: sr.service_type,
                        requestedFor,
                        notes: displayNotes,
                        status: statusMap[sr.status] || 'new',
                        ownerName: sr.owner?.full_name || sr.owner?.email || undefined,
                      };
                    })}
                  onCardSelect={handleCardSelect}
                  onStatusChange={handleStatusChange}
                />
                <ServiceRequestEditDialog
                  open={isEditDialogOpen}
                  onOpenChange={setIsEditDialogOpen}
                  serviceRequest={selectedServiceRequest}
                  onSuccess={() => {
                    refetchServiceRequests();
                  }}
                />
              </>
            )}
          </TabsContent>

          {/* Aircraft */}
          <TabsContent value="aircraft" className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Aircraft</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                View and manage all aircraft in the fleet
              </p>
            </div>
            {isLoadingAircraft ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading aircraft...</p>
                </CardContent>
              </Card>
            ) : aircraftError ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-destructive font-medium mb-2">Error loading aircraft</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {aircraftError instanceof Error ? aircraftError.message : 'Unknown error occurred'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['aircraft-full'] })}
                    >
                      Retry
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <AircraftTable items={aircraftFull} owners={owners} />
            )}
          </TabsContent>

          {/* Maintenance */}
          <TabsContent value="maintenance" className="space-y-6">
            <MaintenanceCRUD />
          </TabsContent>

          {/* Clients */}
          <TabsContent value="clients" className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Clients</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                View and manage client accounts
              </p>
            </div>
            <ClientsTable />
          </TabsContent>

          {/* Staff Management */}
          <TabsContent value="staff" className="space-y-6">
            <StaffManagement />
          </TabsContent>

        </Tabs>
        </div>
      </main>
    </div>
  );
}

