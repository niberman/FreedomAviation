'use client';

import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { KanbanBoard } from "@/components/kanban-board";
import { MaintenanceList } from "@/components/maintenance-list";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { format } from "date-fns";

export default function StaffOperations() {
  const { user } = useAuth();
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<string | null>(null);
  
  const { data: serviceRequests = [], refetch: refetchServiceRequests, error: serviceRequestsError, isLoading: isLoadingServiceRequests } = useQuery({
    queryKey: ['/api/service-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id, service_type, requested_departure, description, status, priority, airport, created_at, aircraft_id, user_id,
          aircraft:aircraft_id(tail_number),
          owner:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    enabled: Boolean(user),
  });

  const { data: maintenanceItems = [] } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select(`id, aircraft_id, item_name, due_date, due_hobbs, status, aircraft:aircraft_id(tail_number, hobbs_hours)`)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m, item: m.item_name, due_at_date: m.due_date, due_at_hours: m.due_hobbs,
      }));
    },
    enabled: Boolean(user),
  });
  
  const handleStatusChange = async (requestId: string, status: "pending" | "in_progress" | "completed") => {
    await supabase.from('service_requests').update({ status }).eq('id', requestId);
    refetchServiceRequests();
  };

  return (
    <DashboardLayout title="Operations" description="Manage service requests and maintenance schedules" navItems={staffDashboardNavItems} actions={<ThemeToggle />}>
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
          </div>
          {isLoadingServiceRequests ? (
            <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Loading...</p></CardContent></Card>
          ) : serviceRequests.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No service requests yet.</p></CardContent></Card>
          ) : (
            <KanbanBoard
              items={serviceRequests.map((sr: any) => ({
                id: sr.id,
                tailNumber: sr.aircraft?.tail_number || 'N/A',
                type: sr.service_type,
                requestedFor: sr.requested_departure ? format(new Date(sr.requested_departure), 'MMM d, yyyy HH:mm') : sr.airport || 'TBD',
                notes: sr.description || '',
                status: sr.status === 'pending' ? 'new' : sr.status === 'in_progress' ? 'in_progress' : 'done',
                ownerName: sr.owner?.full_name || sr.owner?.email,
              }))}
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
          </div>
          <MaintenanceList items={maintenanceItems.map((m: any) => ({
            id: m.id,
            tailNumber: m.aircraft?.tail_number || 'N/A',
            title: m.item,
            hobbsDue: m.due_at_hours,
            hobbsCurrent: m.aircraft?.hobbs_hours,
            calendarDue: m.due_at_date,
            status: m.status === 'overdue' ? 'overdue' : m.status === 'due_soon' ? 'due_soon' : 'ok',
          }))} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

