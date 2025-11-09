import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { KanbanBoard } from "@/components/kanban-board";
import { MaintenanceList } from "@/components/maintenance-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function StaffOperations() {
  const { user } = useAuth();
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<string | null>(null);
  
  // Fetch service requests for kanban board
  const { data: serviceRequests = [], refetch: refetchServiceRequests, error: serviceRequestsError, isLoading: isLoadingServiceRequests } = useQuery({
    queryKey: ['/api/service-requests'],
    queryFn: async () => {
      try {
        // First, try to fetch service requests with nested relations
        let query = supabase
          .from('service_requests')
          .select(`
            id,
            service_type,
            requested_departure,
            requested_date,
            requested_time,
            requested_for,
            description,
            status,
            priority,
            airport,
            assigned_to,
            notes,
            created_at,
            aircraft_id,
            user_id,
            aircraft:aircraft_id(tail_number),
            owner:user_id(full_name, email)
          `)
          .order('created_at', { ascending: false });

        let { data, error } = await query;
        
        // If nested query fails, try fetching separately
        if (error && (error.message?.includes('aircraft') || error.message?.includes('owner') || error.message?.includes('user_profiles'))) {
          console.warn('⚠️ Nested query failed, trying separate queries:', error.message);
          
          // Fetch service requests without nested relations
          const srResult = await supabase
            .from('service_requests')
            .select('id, service_type, requested_departure, requested_date, requested_time, requested_for, description, status, priority, airport, assigned_to, notes, created_at, aircraft_id, user_id')
            .order('created_at', { ascending: false });
          
          if (srResult.error) {
            console.error('❌ Error fetching service requests:', srResult.error);
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
          console.error('❌ Error fetching service requests:', error);
          throw error;
        }
        
        return data || [];
      } catch (err: any) {
        console.error('❌ Error in service requests query:', err);
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

  // Fetch maintenance items
  const { data: maintenanceItems = [] } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_due')
        .select(`
          id,
          aircraft_id,
          item,
          due_at_date,
          due_at_hours,
          severity,
          remaining_hours,
          remaining_days,
          aircraft:aircraft_id(tail_number)
        `)
        .order('due_at_date', { ascending: true });
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
        
        // Add hobbs_hours to each maintenance item
        return data.map((m: any) => ({
          ...m,
          aircraft: m.aircraft ? {
            ...m.aircraft,
            hobbs_hours: hobbsMap[m.aircraft_id] || null
          } : null
        }));
      }
      
      return data || [];
    },
    enabled: Boolean(user),
  });
  
  const handleStatusChange = async (requestId: string, status: "pending" | "in_progress" | "completed") => {
    await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', requestId);
    refetchServiceRequests();
  };

  return (
    <DashboardLayout
      title="Operations"
      description="Manage service requests and maintenance schedules"
      navItems={staffDashboardNavItems}
      actions={<ThemeToggle />}
    >
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Service Requests</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Service Requests</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage service requests from aircraft owners
            </p>
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
            <KanbanBoard
              items={serviceRequests.map((sr: any) => {
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
                } else if (sr.requested_date && sr.requested_time) {
                  requestedFor = `${format(new Date(sr.requested_date), 'MMM d, yyyy')} ${sr.requested_time}`;
                } else if (sr.requested_date) {
                  requestedFor = format(new Date(sr.requested_date), 'MMM d, yyyy');
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
              onCardSelect={setSelectedServiceRequest}
              onStatusChange={handleStatusChange}
            />
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Maintenance Tracking</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor maintenance schedules and due dates across the fleet
            </p>
          </div>
          
          <MaintenanceList items={maintenanceItems.map((m: any) => {
            // Calculate status based on due dates and hobbs
            let status: "ok" | "due_soon" | "overdue" = "ok";
            
            if (m.severity === 'high' || m.severity === 'critical') {
              status = "overdue";
            } else if (m.severity === 'medium') {
              status = "due_soon";
            } else if (m.remaining_days !== null && m.remaining_days !== undefined) {
              // Use remaining_days if available
              if (m.remaining_days < 0) {
                status = "overdue";
              } else if (m.remaining_days <= 30) {
                status = "due_soon";
              }
            } else if (m.due_at_date) {
              const dueDate = new Date(m.due_at_date);
              const today = new Date();
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysUntilDue < 0) {
                status = "overdue";
              } else if (daysUntilDue <= 30) {
                status = "due_soon";
              }
            } else if (m.remaining_hours !== null && m.remaining_hours !== undefined) {
              // Use remaining_hours if available
              if (m.remaining_hours < 0) {
                status = "overdue";
              } else if (m.remaining_hours <= 10) {
                status = "due_soon";
              }
            } else if (m.due_at_hours && m.aircraft?.hobbs_hours) {
              const hobbsRemaining = m.due_at_hours - m.aircraft.hobbs_hours;
              if (hobbsRemaining < 0) {
                status = "overdue";
              } else if (hobbsRemaining <= 10) {
                status = "due_soon";
              }
            }

            return {
              id: m.id,
              tailNumber: m.aircraft?.tail_number || 'N/A',
              title: m.item,
              hobbsDue: m.due_at_hours,
              hobbsCurrent: m.aircraft?.hobbs_hours,
              calendarDue: m.due_at_date,
              status,
            };
          })} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}