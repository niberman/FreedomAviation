import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

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
  onCardSelect?: (requestId: string) => void;
  onStatusChange?: (requestId: string, status: "pending" | "in_progress" | "completed") => Promise<void> | void;
}

export function KanbanBoard({ items = [], onCardSelect, onStatusChange }: KanbanBoardProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>(items);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setRequests(items);
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateMatch = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };

    updateMatch();
    window.addEventListener("resize", updateMatch);

    return () => {
      window.removeEventListener("resize", updateMatch);
    };
  }, []);

  const columns = [
    { id: "new", title: "New", color: "bg-blue-500" },
    { id: "in_progress", title: "In Progress", color: "bg-amber-500" },
    { id: "done", title: "Done", color: "bg-green-500" }
  ] as const;
  const statusOrder = columns.map((column) => column.id);
  const columnLabels = columns.reduce<Record<typeof columns[number]["id"], string>>((acc, column) => {
    acc[column.id] = column.title;
    return acc;
  }, {} as Record<typeof columns[number]["id"], string>);

  const kanbanToDbStatus: Record<typeof columns[number]["id"], "pending" | "in_progress" | "completed"> = {
    new: "pending",
    in_progress: "in_progress",
    done: "completed",
  };

  const updateRequestStatus = async (requestId: string, newStatus: typeof columns[number]["id"]) => {
    const previousRequests = requests.map((req) => ({ ...req }));

    setRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: newStatus } : req))
    );

    const runStatusUpdate = async () => {
      const dbStatus = kanbanToDbStatus[newStatus];

      if (onStatusChange) {
        await onStatusChange(requestId, dbStatus);
        return;
      }

      const { error } = await supabase
        .from("service_requests")
        .update({ status: dbStatus })
        .eq("id", requestId);

      if (error) {
        throw error;
      }

      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "service-requests" ||
          query.queryKey[0] === "/api/service-requests",
      });
    };

    try {
      await runStatusUpdate();

      toast({
        title: "Status updated",
        description: `Request moved to ${columnLabels[newStatus]}`,
      });
    } catch (error) {
      setRequests(previousRequests);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, requestId: string) => {
    if (isMobile) return;
    e.dataTransfer.setData("requestId", requestId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: typeof columns[number]["id"]) => {
    e.preventDefault();
    if (isMobile) return;
    const requestId = e.dataTransfer.getData("requestId");
    if (!requestId) return;
    await updateRequestStatus(requestId, newStatus);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isMobile) return;
    e.preventDefault();
  };

  const handleMoveButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    requestId: string,
    targetStatus: typeof columns[number]["id"]
  ) => {
    event.stopPropagation();
    void updateRequestStatus(requestId, targetStatus);
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

  const boardContainerClass = isMobile
    ? "flex w-full gap-4 overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory md:m-0 md:px-0"
    : "grid grid-cols-1 md:grid-cols-3 gap-6";

  const columnWrapperClass = isMobile
    ? "flex-1 min-w-[260px] snap-center"
    : "";

  return (
    <div className={cn(boardContainerClass)}>
      {columns.map(column => (
        <div key={column.id} className={columnWrapperClass}>
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
                  draggable={!isMobile}
                  onDragStart={(e) => handleDragStart(e, request.id)}
                  className={cn(
                    "hover-elevate",
                    isMobile ? "cursor-pointer" : "cursor-move"
                  )}
                  data-testid={`kanban-card-${request.id}`}
                  onClick={() => onCardSelect?.(request.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onCardSelect?.(request.id);
                    }
                  }}
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(() => {
                        const currentIndex = statusOrder.indexOf(request.status);
                        const previousStatus =
                          currentIndex > 0 ? statusOrder[currentIndex - 1] : null;
                        const nextStatus =
                          currentIndex < statusOrder.length - 1
                            ? statusOrder[currentIndex + 1]
                            : null;

                        return (
                          <>
                            {previousStatus && (
                              <Button
                                size="sm"
                                className="h-7 px-2 text-xs"
                                variant="outline"
                                onClick={(event) =>
                                  handleMoveButtonClick(event, request.id, previousStatus)
                                }
                                aria-label={`Move request to ${columnLabels[previousStatus]}`}
                              >
                                <ArrowLeft className="mr-1 h-3 w-3" />
                                {columnLabels[previousStatus]}
                              </Button>
                            )}
                            {nextStatus && (
                              <Button
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={(event) =>
                                  handleMoveButtonClick(event, request.id, nextStatus)
                                }
                                aria-label={`Move request to ${columnLabels[nextStatus]}`}
                              >
                                {columnLabels[nextStatus]}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
