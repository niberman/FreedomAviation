import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Wrench, Plane, Home } from "lucide-react";
import logoImage from "@assets/falogo.png";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Link, useSearch } from "wouter";
import { KanbanBoard } from "@/components/kanban-board";
import { AircraftTable } from "@/components/aircraft-table";
import { ClientsTable } from "@/components/clients-table";
import { ServiceRequestEditDialog } from "@/components/service-request-edit-dialog";
import { authenticatedFetch } from "@/lib/auth-utils";
import { StaffManagement } from "@/components/staff-management";
import { MaintenanceCRUD } from "@/components/maintenance-crud";
import { NotificationCenter } from "@/components/notification-center";
import { useClients } from "@/hooks/useClients";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAircraftTable } from "@/hooks/useAircraft";

// Valid tab values for the management console
const VALID_TABS = [
  // "ramp", // Temporarily disabled
  "requests", "aircraft", "maintenance", "clients", "staff"
] as const;

type TabValue = typeof VALID_TABS[number];

export default function StaffDashboard() {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [requestFilter, setRequestFilter] = useState<'all' | 'service' | 'maintenance' | 'instruction'>('all');

  // Get tab from URL query parameter
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const tabFromUrl = urlParams.get("tab");
  
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
    queryKey: ['/api/service-requests'],
    queryFn: async () => {
      try {
        console.log('Fetching service requests...');
        
        const res = await authenticatedFetch('/api/service-requests');
        
        if (!res.ok) {
          const err = await res.json().catch(() => ({ 
            error: 'Network error',
            message: res.statusText 
          }));
          
          // Provide more helpful error messages
          if (res.status === 503) {
            throw new Error(err.message || 'Server configuration error. Please contact support.');
          } else if (res.status === 403) {
            throw new Error('You do not have permission to view service requests.');
          }
          
          throw new Error(err.message || `Failed to load service requests (${res.status})`);
        }
        
        const json = await res.json();
        console.log('Fetched service requests:', json.serviceRequests?.length || 0);
        return json.serviceRequests || [];
      } catch (error) {
        console.error('Error fetching service requests:', error);
        // The authenticatedFetch will handle 401 errors and session refresh
        throw error;
      }
    },
    // Refetch every 30 seconds to catch new requests
    refetchInterval: 30000,
    // Retry with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle service request status change
  const handleStatusChange = async (requestId: string, status: "pending" | "in_progress" | "completed") => {
    try {
      const res = await authenticatedFetch(`/api/service-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Failed to update status');
      }
      
      toast({ 
        title: 'Status updated', 
        description: `Service request status changed to ${status}` 
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
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

  // Compute filtered requests count
  const filteredRequestsCount = serviceRequests.filter((sr: any) => {
    if (!sr || !sr.id) return false;
    const serviceTypeLower = (sr.service_type || '').toLowerCase();
    if (requestFilter === 'all') return true;
    if (requestFilter === 'maintenance') {
      return serviceTypeLower.includes('maintenance');
    }
    if (requestFilter === 'instruction') {
      return sr.service_type === 'Flight Instruction' || serviceTypeLower.includes('instruction');
    }
    if (requestFilter === 'service') {
      return !serviceTypeLower.includes('maintenance') && 
             sr.service_type !== 'Flight Instruction' && 
             !serviceTypeLower.includes('instruction');
    }
    return true;
  }).length;

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
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      // Use 'maintenance' table instead of 'maintenance_due'
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
      
      // Fetch hobbs_hours separately for each aircraft
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
        
        // Add hobbs_hours to each maintenance item and map old field names to new
        return data.map((m: any) => ({
          ...m,
          // Map new column names to old names for compatibility
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
  });

  const isDev = !import.meta.env.PROD;



  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" data-testid="link-home-from-logo">
                <img
                  src={logoImage}
                  alt="Freedom Aviation"
                  className="h-8 w-auto transition-opacity hover:opacity-80"
                />
              </Link>
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Staff Management Console</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const isAdminPath = window.location.pathname.startsWith('/admin');
                  window.location.href = isAdminPath ? '/admin' : '/staff';
                }}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard Home
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-return-home">
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
              {/* <TabsTrigger value="ramp" data-testid="tab-ramp" className="text-xs sm:text-sm">Ramp Ops</TabsTrigger> */}
              <TabsTrigger value="requests" data-testid="tab-requests" className="text-xs sm:text-sm">Service Requests</TabsTrigger>
              <TabsTrigger value="aircraft" data-testid="tab-aircraft" className="text-xs sm:text-sm">Aircraft</TabsTrigger>
              <TabsTrigger value="maintenance" data-testid="tab-maintenance" className="text-xs sm:text-sm">Maintenance</TabsTrigger>
              <TabsTrigger value="clients" data-testid="tab-clients" className="text-xs sm:text-sm">Clients</TabsTrigger>
              <TabsTrigger value="staff" data-testid="tab-staff" className="text-xs sm:text-sm">Staff</TabsTrigger>
            </TabsList>

          {/* Ramp Operations Dashboard - Temporarily disabled */}
          {/* <TabsContent value="ramp" className="space-y-6">
            <RampDashboard />
          </TabsContent> */}

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
                  {requestFilter === 'all' ? serviceRequests.length : filteredRequestsCount} {requestFilter === 'all' ? 'total' : 'filtered'}
                </Badge>
              )}
            </div>

            {/* Request Type Filter */}
            <div className="flex gap-2 border-b pb-4">
              <Button
                variant={requestFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setRequestFilter('all')}
              >
                All Requests
              </Button>
              <Button
                variant={requestFilter === 'service' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setRequestFilter('service')}
              >
                Service Requests
              </Button>
              <Button
                variant={requestFilter === 'maintenance' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setRequestFilter('maintenance')}
              >
                Maintenance
              </Button>
              <Button
                variant={requestFilter === 'instruction' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setRequestFilter('instruction')}
              >
                Flight Instruction
              </Button>
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
                  {serviceRequestsError instanceof Error && serviceRequestsError.message.includes('Permission') && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Make sure you're logged in as an admin or staff member with proper permissions.
                    </p>
                  )}
                  {serviceRequestsError instanceof Error && serviceRequestsError.message.includes('table not found') && (
                    <p className="text-xs text-muted-foreground mb-4">
                      The database schema may need to be set up. Check the SETUP.md guide.
                    </p>
                  )}
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
            ) : filteredRequestsCount === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {requestFilter === 'all' 
                      ? 'No service requests yet.' 
                      : `No ${requestFilter === 'service' ? 'service' : requestFilter === 'maintenance' ? 'maintenance' : 'flight instruction'} requests found.`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {requestFilter === 'all' 
                      ? 'Service requests from owners will appear here.'
                      : 'Try selecting a different filter or check back later.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <KanbanBoard 
                  items={serviceRequests
                    .filter((sr: any) => {
                      // Filter out any null/undefined items or items without id
                      if (!sr || !sr.id) return false;
                      
                      // Apply request type filter
                      const serviceTypeLower = (sr.service_type || '').toLowerCase();
                      
                      if (requestFilter === 'all') return true;
                      if (requestFilter === 'maintenance') {
                        return serviceTypeLower.includes('maintenance');
                      }
                      if (requestFilter === 'instruction') {
                        return sr.service_type === 'Flight Instruction' || serviceTypeLower.includes('instruction');
                      }
                      if (requestFilter === 'service') {
                        // General service requests (exclude maintenance and instruction)
                        return !serviceTypeLower.includes('maintenance') && 
                               sr.service_type !== 'Flight Instruction' && 
                               !serviceTypeLower.includes('instruction');
                      }
                      return true;
                    })
                    .map((sr: any) => {
                      // Map database statuses to Kanban board statuses
                      const statusMap: Record<string, 'new' | 'in_progress' | 'done'> = {
                        'pending': 'new',
                        'in_progress': 'in_progress',
                        'completed': 'done',
                        'cancelled': 'done', // Treat cancelled as done
                      };
                      
                      // Format requested date/time
                      let requestedFor = 'TBD';
                      if (sr.requested_departure) {
                        const date = new Date(sr.requested_departure);
                        requestedFor = format(date, 'MMM d, yyyy HH:mm');
                      } else if (sr.airport) {
                        requestedFor = sr.airport;
                      }
                      
                      // Use description for display
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

          {/* Aircraft (Admin) */}
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
                  {aircraftError instanceof Error && aircraftError.message.includes('Permission') && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Make sure you're logged in as an admin or staff member with proper permissions.
                    </p>
                  )}
                  {aircraftError instanceof Error && aircraftError.message.includes('table not found') && (
                    <p className="text-xs text-muted-foreground mb-4">
                      The database schema may need to be set up. Check the SETUP.md guide.
                    </p>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/aircraft/full'] })}
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

          {/* Maintenance (Admin) */}
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
