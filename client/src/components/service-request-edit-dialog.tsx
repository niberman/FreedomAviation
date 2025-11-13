import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { ServiceStatus } from "@/lib/types/database";

interface ServiceRequest {
  id: string;
  service_type: string;
  status: ServiceStatus;
  priority?: string | null;
  description?: string | null;
  airport?: string | null;
  requested_departure?: string | null;
  assigned_to?: string | null;
  notes?: string | null;
  fuel_grade?: string | null;
  fuel_quantity?: number | null;
  o2_topoff?: boolean | null;
  tks_topoff?: boolean | null;
  gpu_required?: boolean | null;
  hangar_pullout?: boolean | null;
  is_extra_charge?: boolean | null;
  credits_used?: number | null;
  aircraft_id: string;
  user_id: string;
  aircraft?: { tail_number: string } | null;
  owner?: { full_name: string; email: string } | null;
}

interface ServiceRequestEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequest: ServiceRequest | null;
  onSuccess?: () => void;
}

export function ServiceRequestEditDialog({
  open,
  onOpenChange,
  serviceRequest,
  onSuccess,
}: ServiceRequestEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: "pending" as ServiceStatus,
    priority: "medium",
    description: "",
    airport: "",
    requested_departure: "",
    assigned_to: "",
    notes: "",
    fuel_grade: "",
    fuel_quantity: "",
    o2_topoff: false,
    tks_topoff: false,
    gpu_required: false,
    hangar_pullout: false,
    is_extra_charge: false,
    credits_used: "",
  });

  // Fetch staff users for assignment
  const { data: staffUsers = [] } = useQuery({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .in("role", ["staff", "admin"])
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Update form data when service request changes
  useEffect(() => {
    if (serviceRequest) {
      setFormData({
        status: serviceRequest.status || "pending",
        priority: serviceRequest.priority || "medium",
        description: serviceRequest.description || "",
        airport: serviceRequest.airport || "",
        requested_departure: serviceRequest.requested_departure
          ? format(new Date(serviceRequest.requested_departure), "yyyy-MM-dd'T'HH:mm")
          : "",
        assigned_to: serviceRequest.assigned_to || "",
        notes: serviceRequest.notes || "",
        fuel_grade: serviceRequest.fuel_grade || "",
        fuel_quantity: serviceRequest.fuel_quantity?.toString() || "",
        o2_topoff: serviceRequest.o2_topoff || false,
        tks_topoff: serviceRequest.tks_topoff || false,
        gpu_required: serviceRequest.gpu_required || false,
        hangar_pullout: serviceRequest.hangar_pullout || false,
        is_extra_charge: serviceRequest.is_extra_charge || false,
        credits_used: serviceRequest.credits_used?.toString() || "",
      });
    }
  }, [serviceRequest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceRequest) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        status: formData.status,
        priority: formData.priority || null,
        description: formData.description || null,
        airport: formData.airport || null,
        assigned_to: formData.assigned_to || null,
        notes: formData.notes || null,
        fuel_grade: formData.fuel_grade || null,
        fuel_quantity: formData.fuel_quantity ? parseFloat(formData.fuel_quantity) : null,
        o2_topoff: formData.o2_topoff || null,
        tks_topoff: formData.tks_topoff || null,
        gpu_required: formData.gpu_required || null,
        hangar_pullout: formData.hangar_pullout || null,
        is_extra_charge: formData.is_extra_charge || null,
        credits_used: formData.credits_used ? parseFloat(formData.credits_used) : null,
      };

      // Handle requested_departure
      if (formData.requested_departure) {
        updateData.requested_departure = new Date(formData.requested_departure).toISOString();
      } else {
        updateData.requested_departure = null;
      }

      const { error } = await supabase
        .from("service_requests")
        .update(updateData)
        .eq("id", serviceRequest.id);

      if (error) throw error;

      toast({
        title: "Service request updated",
        description: "The service request has been updated successfully.",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating service request:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update service request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!serviceRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Request</DialogTitle>
          <DialogDescription>
            Update the details of this service request.
            {serviceRequest.aircraft && (
              <span className="block mt-1">
                Aircraft: {serviceRequest.aircraft.tail_number}
                {serviceRequest.owner && ` • Owner: ${serviceRequest.owner.full_name || serviceRequest.owner.email}`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ServiceStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
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
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_type">Service Type</Label>
            <Input
              id="service_type"
              value={serviceRequest.service_type}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Service request description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="airport">Airport</Label>
              <Input
                id="airport"
                value={formData.airport}
                onChange={(e) => setFormData({ ...formData, airport: e.target.value.toUpperCase() })}
                placeholder="KAPA"
                maxLength={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_departure">Requested Departure</Label>
              <Input
                id="requested_departure"
                type="datetime-local"
                value={formData.requested_departure}
                onChange={(e) => setFormData({ ...formData, requested_departure: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Select
              value={formData.assigned_to || "unassigned"}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value === "unassigned" ? "" : value })}
            >
              <SelectTrigger id="assigned_to">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staffUsers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name || staff.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Staff Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes for staff"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Fuel & Services</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuel_grade">Fuel Grade</Label>
                <Select
                  value={formData.fuel_grade || "none"}
                  onValueChange={(value) => setFormData({ ...formData, fuel_grade: value === "none" ? "" : value })}
                >
                  <SelectTrigger id="fuel_grade">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="100LL">100LL</SelectItem>
                    <SelectItem value="Jet-A">Jet-A</SelectItem>
                    <SelectItem value="Jet-A+">Jet-A+</SelectItem>
                    <SelectItem value="MOGAS">MOGAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuel_quantity">Fuel Quantity (gal)</Label>
                <Input
                  id="fuel_quantity"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.fuel_quantity}
                  onChange={(e) => setFormData({ ...formData, fuel_quantity: e.target.value })}
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="o2_topoff"
                  checked={formData.o2_topoff}
                  onCheckedChange={(checked) => setFormData({ ...formData, o2_topoff: checked === true })}
                />
                <Label htmlFor="o2_topoff" className="font-normal cursor-pointer">
                  O₂ Top-off
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tks_topoff"
                  checked={formData.tks_topoff}
                  onCheckedChange={(checked) => setFormData({ ...formData, tks_topoff: checked === true })}
                />
                <Label htmlFor="tks_topoff" className="font-normal cursor-pointer">
                  TKS Top-off
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gpu_required"
                  checked={formData.gpu_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, gpu_required: checked === true })}
                />
                <Label htmlFor="gpu_required" className="font-normal cursor-pointer">
                  GPU Required
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hangar_pullout"
                  checked={formData.hangar_pullout}
                  onCheckedChange={(checked) => setFormData({ ...formData, hangar_pullout: checked === true })}
                />
                <Label htmlFor="hangar_pullout" className="font-normal cursor-pointer">
                  Hangar Pullout
                </Label>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Billing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_extra_charge"
                  checked={formData.is_extra_charge}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_extra_charge: checked === true })}
                />
                <Label htmlFor="is_extra_charge" className="font-normal cursor-pointer">
                  Extra Charge
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits_used">Credits Used</Label>
                <Input
                  id="credits_used"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.credits_used}
                  onChange={(e) => setFormData({ ...formData, credits_used: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

