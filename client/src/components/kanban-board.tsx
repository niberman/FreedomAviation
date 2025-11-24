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
    ? "flex w-full gap-3 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory scroll-smooth md:m-0 md:px-0"
    : "grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6";

  const columnWrapperClass = isMobile
    ? "flex-1 min-w-[280px] sm:min-w-[300px] snap-center"
    : "";

  return (
    <div className={cn(boardContainerClass)}>
      {columns.map(column => (
        <div key={column.id} className={columnWrapperClass}>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${column.color}`} />
            <h3 className="font-semibold text-sm sm:text-base">{column.title}</h3>
            <Badge variant="secondary" className="ml-auto text-xs">
              {requests.filter(r => r.status === column.id).length}
            </Badge>
          </div>
          
          <div 
            className="space-y-2 sm:space-y-3 min-h-[400px] p-2 sm:p-2.5 rounded-md bg-muted/30"
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
                    "hover-elevate transition-shadow",
                    isMobile ? "cursor-pointer active:scale-[0.98]" : "cursor-move"
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
                  <CardHeader className="p-3 sm:p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {request.tailNumber}
                      </Badge>
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        {getServiceTypeLabel(request.type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-2">
                    {request.ownerName && (
                      <p className="text-xs font-medium mb-1.5 truncate">
                        {request.ownerName}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{request.requestedFor}</span>
                    </div>
                    {request.notes && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {request.notes}
                      </p>
                    )}
                    <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
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
                                className="h-7 px-2 text-xs touch-manipulation flex-1 sm:flex-none"
                                variant="outline"
                                onClick={(event) =>
                                  handleMoveButtonClick(event, request.id, previousStatus)
                                }
                                aria-label={`Move request to ${columnLabels[previousStatus]}`}
                              >
                                <ArrowLeft className="mr-1 h-3 w-3" />
                                <span className="truncate">{columnLabels[previousStatus]}</span>
                              </Button>
                            )}
                            {nextStatus && (
                              <Button
                                size="sm"
                                className="h-7 px-2 text-xs touch-manipulation flex-1 sm:flex-none"
                                onClick={(event) =>
                                  handleMoveButtonClick(event, request.id, nextStatus)
                                }
                                aria-label={`Move request to ${columnLabels[nextStatus]}`}
                              >
                                <span className="truncate">{columnLabels[nextStatus]}</span>
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
