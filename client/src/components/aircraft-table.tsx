import { useState, type FormEvent } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, Loader2, Plus, PlusCircle, UserPlus, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Aircraft {
  id: string; // UUID from public.aircraft.id
  tailNumber: string;
  make: string;
  model: string;
  class: string;
  baseAirport: string; // maps to aircraft.base_location
  owner: string; // display only
  ownerId?: string | null;
  ownerEmail?: string | null;
}

interface AircraftOwner {
  id: string;
  full_name?: string | null;
  email?: string | null;
}

const OWNER_NONE_VALUE = "__none__";

type QuickAction = "readiness" | "oil" | "avionics";

interface NewAircraftState {
  tailNumber: string;
  make: string;
  model: string;
  airframeClass: string;
  baseLocation: string;
  year: string;
  ownerId: string;
}

const createInitialAircraftState = (): NewAircraftState => ({
  tailNumber: "",
  make: "",
  model: "",
  airframeClass: "",
  baseLocation: "",
  year: "",
  ownerId: OWNER_NONE_VALUE,
});

export function AircraftTable({
  items,
  owners = [],
  onAircraftCreated,
}: {
  items: Aircraft[];
  owners?: AircraftOwner[];
  onAircraftCreated?: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [baseFilter, setBaseFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAircraft, setNewAircraft] = useState<NewAircraftState>(
    createInitialAircraftState(),
  );
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);
  const [selectedAircraftForAssign, setSelectedAircraftForAssign] =
    useState<Aircraft | null>(null);
  const [selectedOwnerIdForAssign, setSelectedOwnerIdForAssign] =
    useState<string>(OWNER_NONE_VALUE);

  const quickActionMutation = useMutation<void, Error, { action: QuickAction; aircraft: Aircraft }>({
    mutationFn: async ({ action, aircraft }) => {
      if (!aircraft?.id) {
        throw new Error("Missing aircraft identifier");
      }

      if (action === "readiness") {
        const { error } = await supabase
          .from("service_tasks")
          .insert([
            {
              aircraft_id: aircraft.id,
              type: "readiness",
              status: "pending",
              notes: "Created from staff dashboard quick action",
            },
          ]);

        if (error) {
          throw new Error(error.message ?? "Unable to create readiness task.");
        }
        return;
      }

      if (action === "oil") {
        const { error } = await supabase
          .from("consumable_events")
          .insert([
            {
              aircraft_id: aircraft.id,
              kind: "OIL",
              quantity: 2,
              unit: "qt",
              notes: "Top-off request from staff dashboard quick action",
            },
          ]);

        if (error) {
          throw new Error(error.message ?? "Unable to log oil top-off.");
        }
        return;
      }

      if (action === "avionics") {
        const { error } = await supabase
          .from("service_tasks")
          .insert([
            {
              aircraft_id: aircraft.id,
              type: "avionics_db_update",
              status: "pending",
              notes: "Scheduled from staff dashboard quick action",
            },
          ]);

        if (error) {
          throw new Error(error.message ?? "Unable to create avionics database update task.");
        }
        return;
      }

      throw new Error("Unknown quick action");
    },
    onSuccess: (_, { action, aircraft }) => {
      const actionSummary: Record<QuickAction, string> = {
        readiness: "Readiness task created",
        oil: "Oil top-off logged",
        avionics: "Avionics database update scheduled",
      };

      toast({
        title: "Quick action completed",
        description: `${actionSummary[action]} for ${aircraft.tailNumber}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/aircraft/full"] });
    },
    onError: (error, { action, aircraft }) => {
      const actionSummary: Record<QuickAction, string> = {
        readiness: "readiness task",
        oil: "oil top-off",
        avionics: "avionics database update",
      };

      toast({
        title: `Failed to create ${actionSummary[action]}`,
        description: error.message || "Please try again.",
        variant: "destructive",
      });

      console.error("Quick action failed", {
        action,
        aircraftId: aircraft.id,
        error,
      });
    },
  });

  const filteredAircraft =
    baseFilter === "all"
      ? items
      : items.filter((a) => a.baseAirport === baseFilter);

  function handleOpenAssignDialog(aircraft: Aircraft) {
    setSelectedAircraftForAssign(aircraft);
    setSelectedOwnerIdForAssign(
      aircraft.ownerId && aircraft.ownerId !== OWNER_NONE_VALUE
        ? aircraft.ownerId
        : OWNER_NONE_VALUE,
    );
    setIsAssignDialogOpen(true);
  }

  function resetAssignDialog() {
    setIsAssignDialogOpen(false);
    setIsAssignSubmitting(false);
    setSelectedAircraftForAssign(null);
    setSelectedOwnerIdForAssign(OWNER_NONE_VALUE);
  }

  async function handleAssignAircraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAircraftForAssign) {
      resetAssignDialog();
      return;
    }

    const aircraftId = selectedAircraftForAssign.id;
    const ownerId =
      selectedOwnerIdForAssign === OWNER_NONE_VALUE
        ? null
        : selectedOwnerIdForAssign;

    setIsAssignSubmitting(true);

    try {
      const { error } = await supabase
        .from("aircraft")
        .update({ owner_id: ownerId })
        .eq("id", aircraftId);

      if (error) {
        throw error;
      }

      toast({
        title: "Aircraft updated",
        description: ownerId
          ? `Assigned ${selectedAircraftForAssign.tailNumber} to the selected client.`
          : `Removed client assignment from ${selectedAircraftForAssign.tailNumber}.`,
      });

      resetAssignDialog();
      queryClient.invalidateQueries({ queryKey: ["/api/aircraft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/aircraft/full"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onAircraftCreated?.();
    } catch (err: any) {
      setIsAssignSubmitting(false);
      toast({
        title: "Failed to update aircraft",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleCreateAircraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const tailNumber = newAircraft.tailNumber.trim().toUpperCase();
    if (!tailNumber) {
      toast({
        title: "Tail number required",
        description: "Please provide a tail number before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, string | number | null> = {
        tail_number: tailNumber,
        make: newAircraft.make.trim() || null,
        model: newAircraft.model.trim() || null,
        class: newAircraft.airframeClass.trim() || null,
        base_location: newAircraft.baseLocation.trim() || null,
      };

      if (newAircraft.year) {
        const parsedYear = Number(newAircraft.year);
        if (!Number.isNaN(parsedYear)) {
          payload.year = parsedYear;
        }
      }

      const ownerId =
        newAircraft.ownerId && newAircraft.ownerId !== OWNER_NONE_VALUE
          ? newAircraft.ownerId
          : null;
      payload.owner_id = ownerId;

      const { error } = await supabase.from("aircraft").insert(payload);

      if (error) {
        throw error;
      }

      toast({
        title: "Aircraft added",
        description: ownerId
          ? `Assigned ${tailNumber} to the selected client.`
          : `Added ${tailNumber} without an assigned client.`,
      });

      setIsAddDialogOpen(false);
      setNewAircraft(createInitialAircraftState());

      queryClient.invalidateQueries({ queryKey: ["/api/aircraft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/aircraft/full"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onAircraftCreated?.();
    } catch (err: any) {
      toast({
        title: "Failed to add aircraft",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Aircraft Inventory</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="default"
            onClick={() => setIsAddDialogOpen(true)}
            data-testid="button-add-aircraft"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Aircraft
          </Button>
          <Select value={baseFilter} onValueChange={setBaseFilter}>
            <SelectTrigger
              className="w-[180px]"
              data-testid="select-base-filter"
            >
              <SelectValue placeholder="Filter by base" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bases</SelectItem>
              <SelectItem value="KAPA">KAPA</SelectItem>
              <SelectItem value="KBJC">KBJC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Tail Number</TableHead>
              <TableHead>Aircraft</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAircraft.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No aircraft at this base yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredAircraft.map((a) => (
                <TableRow key={a.id} data-testid={`aircraft-row-${a.id}`}>
                  <TableCell className="font-mono font-semibold">
                    {a.tailNumber}
                  </TableCell>
                  <TableCell>
                    {a.make} {a.model}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{a.class}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{a.baseAirport}</TableCell>
                  <TableCell>{a.owner}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenAssignDialog(a)}
                        data-testid={`button-assign-${a.id}`}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="sr-only">Assign to client</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={
                          quickActionMutation.isPending &&
                          quickActionMutation.variables?.aircraft.id === a.id
                        }
                        onClick={() =>
                          quickActionMutation.mutate({ action: "readiness", aircraft: a })
                        }
                        data-testid={`button-readiness-${a.id}`}
                      >
                        {quickActionMutation.isPending &&
                        quickActionMutation.variables?.aircraft.id === a.id &&
                        quickActionMutation.variables?.action === "readiness" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={
                          quickActionMutation.isPending &&
                          quickActionMutation.variables?.aircraft.id === a.id
                        }
                        onClick={() =>
                          quickActionMutation.mutate({ action: "oil", aircraft: a })
                        }
                        data-testid={`button-topoff-${a.id}`}
                      >
                        {quickActionMutation.isPending &&
                        quickActionMutation.variables?.aircraft.id === a.id &&
                        quickActionMutation.variables?.action === "oil" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wrench className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={
                          quickActionMutation.isPending &&
                          quickActionMutation.variables?.aircraft.id === a.id
                        }
                        onClick={() =>
                          quickActionMutation.mutate({ action: "avionics", aircraft: a })
                        }
                        data-testid={`button-db-update-${a.id}`}
                      >
                        {quickActionMutation.isPending &&
                        quickActionMutation.variables?.aircraft.id === a.id &&
                        quickActionMutation.variables?.action === "avionics" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Database className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Aircraft</DialogTitle>
            <DialogDescription>
              Record a new aircraft and optionally assign it to a client.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateAircraft}>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="aircraft-tail">Tail Number *</Label>
                <Input
                  id="aircraft-tail"
                  placeholder="N123FA"
                  value={newAircraft.tailNumber}
                  onChange={(event) =>
                    setNewAircraft((prev) => ({
                      ...prev,
                      tailNumber: event.target.value,
                    }))
                  }
                  required
                  autoFocus
                  data-testid="input-aircraft-tail"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aircraft-make">Make</Label>
                  <Input
                    id="aircraft-make"
                    placeholder="Cirrus"
                    value={newAircraft.make}
                    onChange={(event) =>
                      setNewAircraft((prev) => ({
                        ...prev,
                        make: event.target.value,
                      }))
                    }
                    data-testid="input-aircraft-make"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aircraft-model">Model</Label>
                  <Input
                    id="aircraft-model"
                    placeholder="SR22T"
                    value={newAircraft.model}
                    onChange={(event) =>
                      setNewAircraft((prev) => ({
                        ...prev,
                        model: event.target.value,
                      }))
                    }
                    data-testid="input-aircraft-model"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aircraft-class">Class</Label>
                  <Input
                    id="aircraft-class"
                    placeholder="TAA"
                    value={newAircraft.airframeClass}
                    onChange={(event) =>
                      setNewAircraft((prev) => ({
                        ...prev,
                        airframeClass: event.target.value,
                      }))
                    }
                    data-testid="input-aircraft-class"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aircraft-base">Base</Label>
                  <Input
                    id="aircraft-base"
                    placeholder="KAPA"
                    value={newAircraft.baseLocation}
                    onChange={(event) =>
                      setNewAircraft((prev) => ({
                        ...prev,
                        baseLocation: event.target.value,
                      }))
                    }
                    data-testid="input-aircraft-base"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aircraft-year">Year</Label>
                  <Input
                    id="aircraft-year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder="2024"
                    value={newAircraft.year}
                    onChange={(event) =>
                      setNewAircraft((prev) => ({
                        ...prev,
                        year: event.target.value,
                      }))
                    }
                    data-testid="input-aircraft-year"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assign to Client</Label>
                  <Select
                    value={newAircraft.ownerId}
                    onValueChange={(value) =>
                      setNewAircraft((prev) => ({
                        ...prev,
                        ownerId: value,
                      }))
                    }
                  >
                    <SelectTrigger data-testid="select-aircraft-owner">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OWNER_NONE_VALUE}>
                        Unassigned
                      </SelectItem>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.full_name || owner.email || owner.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewAircraft(createInitialAircraftState());
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-save-aircraft"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Aircraft"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {
        if (!open) {
          resetAssignDialog();
          return;
        }
        setIsAssignDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Aircraft to Client</DialogTitle>
            <DialogDescription>
              Choose which client should own this aircraft.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignAircraft} className="space-y-4">
            <div className="space-y-2">
              <Label>Aircraft</Label>
              <div className="rounded-md border bg-muted px-3 py-2 font-mono">
                {selectedAircraftForAssign?.tailNumber ?? "N/A"}
              </div>
              {selectedAircraftForAssign && (
                <p className="text-xs text-muted-foreground">
                  Current owner: {selectedAircraftForAssign.owner || "Unassigned"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-owner">Assign to Client</Label>
              <Select
                value={selectedOwnerIdForAssign}
                onValueChange={setSelectedOwnerIdForAssign}
              >
                <SelectTrigger id="assign-owner" data-testid="select-assign-owner">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OWNER_NONE_VALUE}>Unassigned</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.full_name || owner.email || owner.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetAssignDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAssignSubmitting}
                data-testid="button-save-assignment"
              >
                {isAssignSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Assignment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
