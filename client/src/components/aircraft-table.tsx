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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, PlusCircle, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";

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

type ServiceType = "readiness" | "avionics_db_update" | "preflight" | "detail" | "clean" | "o2" | "tks" | "db_update" | "maintenance" | "inspection" | "repair" | "other";

interface ServiceOption {
  value: ServiceType | "oil_topoff";
  label: string;
  description?: string;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  { value: "readiness", label: "Readiness Check", description: "Create a readiness task" },
  { value: "oil_topoff", label: "Oil Top-Off", description: "Log oil top-off in consumable events" },
  { value: "avionics_db_update", label: "Avionics Database Update", description: "Schedule avionics database update" },
  { value: "preflight", label: "Pre-Flight Check", description: "Pre-flight inspection" },
  { value: "detail", label: "Full Detail", description: "Full aircraft detail service" },
  { value: "clean", label: "Cleaning", description: "Aircraft cleaning service" },
  { value: "o2", label: "Oxygen Service", description: "Oxygen system service" },
  { value: "tks", label: "TKS Fluid Service", description: "TKS fluid service" },
  { value: "db_update", label: "Database Update", description: "General database update" },
  { value: "maintenance", label: "Maintenance", description: "General maintenance task" },
  { value: "inspection", label: "Inspection", description: "Aircraft inspection" },
  { value: "repair", label: "Repair", description: "Repair service" },
  { value: "other", label: "Other Service", description: "Other service type" },
];

interface NewAircraftState {
  tailNumber: string;
  make: string;
  model: string;
  airframeClass: string;
  baseLocation: string;
  year: string;
  ownerId: string;
  hasTks: boolean;
  hasOxygen: boolean;
}

const createInitialAircraftState = (): NewAircraftState => ({
  tailNumber: "",
  make: "",
  model: "",
  airframeClass: "",
  baseLocation: "",
  year: "",
  ownerId: OWNER_NONE_VALUE,
  hasTks: false,
  hasOxygen: false,
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
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedAircraftForService, setSelectedAircraftForService] =
    useState<Aircraft | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | "oil_topoff">("readiness");
  const [serviceNotes, setServiceNotes] = useState("");

  const serviceMutation = useMutation<void, Error, { serviceType: ServiceType | "oil_topoff"; aircraft: Aircraft; notes: string }>({
    mutationFn: async ({ serviceType, aircraft, notes }) => {
      if (!aircraft?.id) {
        throw new Error("Missing aircraft identifier");
      }

      if (serviceType === "oil_topoff") {
        const { error } = await supabase
          .from("consumable_events")
          .insert([
            {
              aircraft_id: aircraft.id,
              kind: "OIL",
              quantity: 2,
              unit: "qt",
              notes: notes || "Top-off request from staff dashboard",
            },
          ]);

        if (error) {
          throw new Error(error.message ?? "Unable to log oil top-off.");
        }
        return;
      }

      // All other services create service_tasks
      const { error } = await supabase
        .from("service_tasks")
        .insert([
          {
            aircraft_id: aircraft.id,
            type: serviceType,
            status: "pending",
            notes: notes || `Service task created from staff dashboard`,
          },
        ]);

      if (error) {
        throw new Error(error.message ?? `Unable to create ${serviceType} task.`);
      }
      return;
    },
    onSuccess: (_, { serviceType, aircraft }) => {
      const serviceOption = SERVICE_OPTIONS.find(opt => opt.value === serviceType);
      const serviceLabel = serviceOption?.label || serviceType;

      toast({
        title: "Service added",
        description: `${serviceLabel} created for ${aircraft.tailNumber}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/service-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/aircraft/full"] });
      
      // Reset dialog state
      setIsServiceDialogOpen(false);
      setSelectedAircraftForService(null);
      setSelectedServiceType("readiness");
      setServiceNotes("");
    },
    onError: (error, { serviceType, aircraft }) => {
      const serviceOption = SERVICE_OPTIONS.find(opt => opt.value === serviceType);
      const serviceLabel = serviceOption?.label || serviceType;

      toast({
        title: `Failed to create ${serviceLabel}`,
        description: error.message || "Please try again.",
        variant: "destructive",
      });

      console.error("Service creation failed", {
        serviceType,
        aircraftId: aircraft.id,
        error,
      });
    },
  });

  function handleOpenServiceDialog(aircraft: Aircraft) {
    setSelectedAircraftForService(aircraft);
    setSelectedServiceType("readiness");
    setServiceNotes("");
    setIsServiceDialogOpen(true);
  }

  function handleSubmitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAircraftForService) {
      return;
    }

    serviceMutation.mutate({
      serviceType: selectedServiceType,
      aircraft: selectedAircraftForService,
      notes: serviceNotes,
    });
  }

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
      const payload: Record<string, string | number | boolean | null> = {
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
      payload.has_tks = newAircraft.hasTks;
      payload.has_oxygen = newAircraft.hasOxygen;

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

      <div className="overflow-x-auto border rounded-md scroll-smooth-touch scrollbar-hide">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Tail Number</TableHead>
              <TableHead>Aircraft</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                        size="sm"
                        variant="outline"
                        disabled={
                          serviceMutation.isPending &&
                          serviceMutation.variables?.aircraft.id === a.id
                        }
                        onClick={() => handleOpenServiceDialog(a)}
                        data-testid={`button-add-service-${a.id}`}
                      >
                        {serviceMutation.isPending &&
                        serviceMutation.variables?.aircraft.id === a.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Service
                          </>
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

              <div className="space-y-3">
                <Label className="text-base">Aircraft Systems</Label>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aircraft-tks"
                      checked={newAircraft.hasTks}
                      onCheckedChange={(checked) =>
                        setNewAircraft((prev) => ({
                          ...prev,
                          hasTks: checked === true,
                        }))
                      }
                      data-testid="checkbox-aircraft-tks"
                    />
                    <Label htmlFor="aircraft-tks" className="font-normal cursor-pointer">
                      TKS Ice Protection
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aircraft-oxygen"
                      checked={newAircraft.hasOxygen}
                      onCheckedChange={(checked) =>
                        setNewAircraft((prev) => ({
                          ...prev,
                          hasOxygen: checked === true,
                        }))
                      }
                      data-testid="checkbox-aircraft-oxygen"
                    />
                    <Label htmlFor="aircraft-oxygen" className="font-normal cursor-pointer">
                      Oxygen System
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Systems determine pricing class: Class I (oil only) or Class II (TKS/oxygen)
                </p>
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

      <Dialog open={isServiceDialogOpen} onOpenChange={(open) => {
        if (!open && !serviceMutation.isPending) {
          setIsServiceDialogOpen(false);
          setSelectedAircraftForService(null);
          setSelectedServiceType("readiness");
          setServiceNotes("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription>
              Select a service type to add for {selectedAircraftForService?.tailNumber || "this aircraft"}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitService} className="space-y-4">
            <div className="space-y-2">
              <Label>Aircraft</Label>
              <div className="rounded-md border bg-muted px-3 py-2 font-mono">
                {selectedAircraftForService?.tailNumber ?? "N/A"}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-type">Service Type</Label>
              <Select
                value={selectedServiceType}
                onValueChange={(value) => setSelectedServiceType(value as ServiceType | "oil_topoff")}
              >
                <SelectTrigger id="service-type" data-testid="select-service-type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-notes">Notes (Optional)</Label>
              <Textarea
                id="service-notes"
                placeholder="Add any notes or details about this service..."
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                rows={3}
                data-testid="textarea-service-notes"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!serviceMutation.isPending) {
                    setIsServiceDialogOpen(false);
                    setSelectedAircraftForService(null);
                    setSelectedServiceType("readiness");
                    setServiceNotes("");
                  }
                }}
                disabled={serviceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={serviceMutation.isPending}
                data-testid="button-submit-service"
              >
                {serviceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Service"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
