import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ServiceRequest {
  id: string;
  tailNumber: string;
  type: string;
  requestedFor: string;
  notes?: string;
  status: "new" | "in_progress" | "done";
  ownerName?: string;
}

interface KanbanBoardProps {
  items?: ServiceRequest[];
}

export function KanbanBoard({ items = [] }: KanbanBoardProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>(items);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update local state when props change
  useEffect(() => {
    setRequests(items);
  }, [items]);

  const columns = [
    { id: "new", title: "New", color: "bg-blue-500" },
    { id: "in_progress", title: "In Progress", color: "bg-amber-500" },
    { id: "done", title: "Done", color: "bg-green-500" }
  ] as const;

  const handleDragStart = (e: React.DragEvent, requestId: string) => {
    e.dataTransfer.setData("requestId", requestId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: typeof columns[number]["id"]) => {
    e.preventDefault();
    const requestId = e.dataTransfer.getData("requestId");
    
    // Map Kanban statuses back to database statuses
    const statusMap: Record<string, 'pending' | 'in_progress' | 'completed'> = {
      'new': 'pending',
      'in_progress': 'in_progress',
      'done': 'completed',
    };
    
    const dbStatus = statusMap[newStatus] || 'pending';
    
    // Optimistically update UI
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: newStatus } : req
    ));

    // Update in database with mapped status
    const { error } = await supabase
      .from('service_requests')
      .update({ status: dbStatus })
      .eq('id', requestId);

    if (error) {
      // Revert on error
      setRequests(items);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status updated",
        description: `Request moved to ${newStatus.replace('_', ' ')}`,
      });
      
      // Invalidate all service request queries to refresh both client and staff dashboards
      await queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "service-requests" || 
          query.queryKey[0] === "/api/service-requests"
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      detail: "Detail",
      db_update: "DB Update",
      o2: "O₂",
      tks: "TKS",
      oil: "Oil",
      staging: "Staging",
      maintenance: "Maintenance",
      "Pre-Flight Concierge": "Pre-Flight",
      "Flight Instruction": "Flight Instruction",
      other: "Other"
    };
    return labels[type] || type;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(column => (
        <div key={column.id}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <h3 className="font-semibold">{column.title}</h3>
            <Badge variant="secondary" className="ml-auto">
              {requests.filter(r => r.status === column.id).length}
            </Badge>
          </div>
          
          <div 
            className="space-y-3 min-h-[400px] p-2 rounded-md bg-muted/30"
            onDrop={(e) => handleDrop(e, column.id)}
            onDragOver={handleDragOver}
            data-testid={`kanban-column-${column.id}`}
          >
            {requests
              .filter(request => request.status === column.id)
              .map(request => (
                <Card 
                  key={request.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, request.id)}
                  className="cursor-move hover-elevate"
                  data-testid={`kanban-card-${request.id}`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="font-mono">
                        {request.tailNumber}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getServiceTypeLabel(request.type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    {request.ownerName && (
                      <p className="text-xs font-medium mb-1.5">
                        {request.ownerName}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {request.requestedFor}
                    </div>
                    {request.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {request.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
