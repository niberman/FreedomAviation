'use client';

import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { KanbanBoard } from "@/components/kanban-board";
import { MaintenanceList } from "@/components/maintenance-list";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Wrench } from "lucide-react";
import { useStaffServiceRequests } from "@/hooks/useServiceRequests";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { format } from "date-fns";

interface ServiceRequestRow {
  id: string;
  service_type: string;
  requested_departure?: string;
  description?: string;
  status: string;
  priority: string;
  airport?: string;
  aircraft?: { tail_number?: string } | null;
  owner?: { full_name?: string; email?: string } | null;
}

interface MaintenanceRow {
  id: string;
  item_name: string;
  due_date?: string;
  due_hobbs?: number;
  status: string;
  aircraft?: { tail_number?: string; hobbs_hours?: number } | null;
}

export default function StaffOperations() {
  const { user } = useAuth();
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<string | null>(null);

  const {
    data: serviceRequests = [],
    isLoading: isLoadingServiceRequests,
    updateStatus,
  } = useStaffServiceRequests();

  const { data: maintenanceItems = [] } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('id, aircraft_id, item_name, due_date, due_hobbs, status, aircraft:aircraft_id(tail_number, hobbs_hours)')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data || []) as MaintenanceRow[];
    },
    enabled: Boolean(user),
  });

  const handleStatusChange = (requestId: string, status: "pending" | "in_progress" | "completed") => {
    updateStatus({ requestId, status });
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
              items={(serviceRequests as ServiceRequestRow[]).map((sr) => ({
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
          <MaintenanceList items={maintenanceItems.map((m) => ({
            id: m.id,
            tailNumber: m.aircraft?.tail_number || 'N/A',
            title: m.item_name,
            hobbsDue: m.due_hobbs,
            hobbsCurrent: m.aircraft?.hobbs_hours,
            calendarDue: m.due_date,
            status: m.status === 'overdue' ? 'overdue' : m.status === 'due_soon' ? 'due_soon' : 'ok',
          }))} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
