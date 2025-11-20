import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Plus, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Edit,
  Trash2,
  Gauge
} from "lucide-react";

interface MaintenanceItem {
  id: string;
  aircraft_id: string;
  item_name: string;
  due_date?: string;
  due_hobbs?: number;
  status: "pending" | "due_soon" | "overdue" | "completed";
  notes?: string;
  created_at: string;
  aircraft?: {
    tail_number: string;
    hobbs_hours?: number;
  };
}

export function MaintenanceCRUD() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaintenanceItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form state
  const [selectedAircraftId, setSelectedAircraftId] = useState("");
  const [itemName, setItemName] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueHobbs, setDueHobbs] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch aircraft for dropdown
  const { data: aircraft = [] } = useQuery({
    queryKey: ["aircraft-for-maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aircraft")
        .select("id, tail_number, hobbs_hours")
        .order("tail_number");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch maintenance items
  const { data: maintenanceItems = [], isLoading } = useQuery({
    queryKey: ["/api/maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select(`
          id,
          aircraft_id,
          item_name,
          due_date,
          due_hobbs,
          status,
          notes,
          created_at,
          aircraft:aircraft_id(tail_number, hobbs_hours)
        `)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as MaintenanceItem[];
    },
  });

  // Create maintenance item mutation
  const createMaintenanceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAircraftId || !itemName || (!dueDate && !dueHobbs)) {
        throw new Error("Please fill in all required fields");
      }

      // Calculate status based on due date or hobbs
      let status: MaintenanceItem["status"] = "pending";
      if (dueDate) {
        const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue < 0) status = "overdue";
        else if (daysUntilDue <= 30) status = "due_soon";
      } else if (dueHobbs) {
        const selectedAircraft = aircraft.find(a => a.id === selectedAircraftId);
        if (selectedAircraft?.hobbs_hours) {
          const hoursRemaining = parseFloat(dueHobbs) - selectedAircraft.hobbs_hours;
          if (hoursRemaining < 0) status = "overdue";
          else if (hoursRemaining <= 10) status = "due_soon";
        }
      }

      const { data, error } = await supabase
        .from("maintenance")
        .insert({
          aircraft_id: selectedAircraftId,
          item_name: itemName,
          due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
          due_hobbs: dueHobbs ? parseFloat(dueHobbs) : null,
          status,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Maintenance item created",
        description: "The maintenance item has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      setIsAddDialogOpen(false);
      // Reset form
      setSelectedAircraftId("");
      setItemName("");
      setDueDate(undefined);
      setDueHobbs("");
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Error creating maintenance item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update maintenance item mutation
  const updateMaintenanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MaintenanceItem> }) => {
      const { error } = await supabase
        .from("maintenance")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Maintenance item updated",
        description: "Changes have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      setEditingItem(null);
    },
    onError: (error) => {
      toast({
        title: "Error updating maintenance item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete maintenance item mutation
  const deleteMaintenanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("maintenance")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Maintenance item deleted",
        description: "The maintenance item has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      setDeleteConfirmId(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting maintenance item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Mark as completed mutation
  const completeMaintenanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("maintenance")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Maintenance completed",
        description: "The maintenance item has been marked as completed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
    },
    onError: (error) => {
      toast({
        title: "Error completing maintenance",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleEditSubmit = () => {
    if (!editingItem) return;

    let status = editingItem.status;
    // Recalculate status if dates changed
    if (editingItem.due_date) {
      const dueDate = new Date(editingItem.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) status = "overdue";
      else if (daysUntilDue <= 30) status = "due_soon";
      else status = "pending";
    }

    updateMaintenanceMutation.mutate({
      id: editingItem.id,
      updates: {
        item_name: editingItem.item_name,
        due_date: editingItem.due_date,
        due_hobbs: editingItem.due_hobbs,
        notes: editingItem.notes,
        status,
      },
    });
  };

  const getStatusBadge = (status: MaintenanceItem["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "overdue":
        return <Badge className="bg-red-500 text-white"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      case "due_soon":
        return <Badge className="bg-amber-500 text-white"><Clock className="h-3 w-3 mr-1" />Due Soon</Badge>;
      default:
        return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Management
              </CardTitle>
              <CardDescription>
                Create and manage maintenance schedules for aircraft
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading maintenance items...</p>
            </div>
          ) : maintenanceItems.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No maintenance items scheduled.</p>
              <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
                Schedule First Maintenance
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenanceItems.map((item) => (
                <Card key={item.id} className="border-l-4" style={{
                  borderLeftColor: 
                    item.status === "overdue" ? "rgb(239 68 68)" :
                    item.status === "due_soon" ? "rgb(245 158 11)" :
                    item.status === "completed" ? "rgb(34 197 94)" :
                    "rgb(203 213 225)"
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{item.item_name}</h4>
                          <Badge variant="outline" className="font-mono">
                            {item.aircraft?.tail_number || "N/A"}
                          </Badge>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {item.due_date && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              Due: {format(new Date(item.due_date), "MMM d, yyyy")}
                            </div>
                          )}
                          {item.due_hobbs && (
                            <div className="flex items-center gap-1">
                              <Gauge className="h-4 w-4" />
                              Due at {item.due_hobbs} Hobbs
                              {item.aircraft?.hobbs_hours && (
                                <span className="text-xs">
                                  (Current: {item.aircraft.hobbs_hours})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => completeMaintenanceMutation.mutate(item.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Maintenance Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>
              Add a new maintenance item for an aircraft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aircraft">Aircraft *</Label>
              <Select value={selectedAircraftId} onValueChange={setSelectedAircraftId}>
                <SelectTrigger id="aircraft">
                  <SelectValue placeholder="Select aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map((ac) => (
                    <SelectItem key={ac.id} value={ac.id}>
                      {ac.tail_number}
                      {ac.hobbs_hours && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({ac.hobbs_hours} Hobbs)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemName">Maintenance Item *</Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Oil Change, Annual Inspection, Tire Replacement"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueHobbs">Due at Hobbs Hours</Label>
                <Input
                  id="dueHobbs"
                  type="number"
                  step="0.1"
                  value={dueHobbs}
                  onChange={(e) => setDueHobbs(e.target.value)}
                  placeholder="e.g., 1250.5"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or requirements"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              * You must specify either a due date, Hobbs hours, or both.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={createMaintenanceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMaintenanceMutation.mutate()}
              disabled={createMaintenanceMutation.isPending}
            >
              Create Maintenance Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Maintenance Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Maintenance Item</DialogTitle>
              <DialogDescription>
                Update maintenance schedule details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Aircraft</Label>
                <Input value={editingItem.aircraft?.tail_number || "N/A"} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-itemName">Maintenance Item</Label>
                <Input
                  id="edit-itemName"
                  value={editingItem.item_name}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    item_name: e.target.value
                  })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editingItem.due_date || ""}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      due_date: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due at Hobbs Hours</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingItem.due_hobbs || ""}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      due_hobbs: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={editingItem.notes || ""}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    notes: e.target.value
                  })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)}
                disabled={updateMaintenanceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={updateMaintenanceMutation.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Maintenance Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this maintenance item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleteMaintenanceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMaintenanceMutation.mutate(deleteConfirmId)}
              disabled={deleteMaintenanceMutation.isPending}
            >
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}





