import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { ServiceRequest, ServiceStatus } from "@/lib/types/database";

interface ServiceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequest: ServiceRequest | null;
}

export function ServiceRequestDialog({ 
  open, 
  onOpenChange, 
  serviceRequest 
}: ServiceRequestDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [status, setStatus] = useState<ServiceStatus>("pending");
  const [priority, setPriority] = useState<string>("medium");
  const [requestedDeparture, setRequestedDeparture] = useState("");
  const [description, setDescription] = useState("");
  
  // Initialize form when service request changes
  useState(() => {
    if (serviceRequest) {
      setStatus(serviceRequest.status);
      setPriority(serviceRequest.priority || "medium");
      setRequestedDeparture(
        serviceRequest.requested_departure 
          ? format(new Date(serviceRequest.requested_departure), "yyyy-MM-dd'T'HH:mm")
          : ""
      );
      setDescription(serviceRequest.description || "");
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!serviceRequest) return;
      
      const updates = {
        status,
        priority: priority === "__none__" ? null : priority,
        requested_departure: requestedDeparture 
          ? new Date(requestedDeparture).toISOString()
          : null,
        description,
      };
      
      const { data, error } = await supabase
        .from("service_requests")
        .update(updates)
        .eq("id", serviceRequest.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({
        title: "Service request updated",
        description: "Changes saved successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  if (!serviceRequest) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Service Request</DialogTitle>
          <DialogDescription>
            Update status, priority, scheduling details, and notes for this service request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Owner</p>
              <p className="text-sm font-semibold">
                {(serviceRequest as any).owner?.full_name || 
                 (serviceRequest as any).owner?.email || 
                 'Unknown owner'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Aircraft</p>
              <p className="text-sm font-mono font-semibold">
                {(serviceRequest as any).aircraft?.tail_number || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Service Type</p>
              <p className="text-sm font-semibold">{serviceRequest.service_type}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Created</p>
              <p className="text-sm">
                {serviceRequest.created_at
                  ? format(new Date(serviceRequest.created_at), 'MMM d, yyyy HH:mm')
                  : 'Unknown'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-request-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ServiceStatus)}
              >
                <SelectTrigger id="service-request-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-request-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={setPriority}
              >
                <SelectTrigger id="service-request-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not set</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-request-requested-departure">Requested Departure</Label>
            <Input
              id="service-request-requested-departure"
              type="datetime-local"
              value={requestedDeparture}
              onChange={(event) => setRequestedDeparture(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-request-description">Notes</Label>
            <Textarea
              id="service-request-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add internal notes or update the request description"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
