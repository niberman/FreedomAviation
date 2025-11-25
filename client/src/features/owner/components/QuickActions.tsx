import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Plane, Wrench, GraduationCap, Calendar, Fuel, Zap, Wind, Warehouse, Droplets, Battery } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

type FuelTarget = 'ADD_QUANTITY' | 'FILL_TO_TABS' | 'FILL_TO_TABS_PLUS' | 'FILL_TO_FULL';

interface QuickActionsProps {
  aircraftId: string;
  userId: string;
  aircraftData?: {
    id: string;
    tail_number: string;
    base_location: string | null;
  };
  isDemo?: boolean;
}

export function QuickActions({ aircraftId, userId, aircraftData, isDemo = false }: QuickActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openPrep, setOpenPrep] = useState(false);
  const [openService, setOpenService] = useState(false);
  const [openInstruction, setOpenInstruction] = useState(false);
  const [loading, setLoading] = useState(false);

  const [prepForm, setPrepForm] = useState({
    aircraft_id: "",
    airport: "",
    requested_departure: "",
    fuel_target: "ADD_QUANTITY" as FuelTarget,
    fuel_add_quantity: "" as number | "",
    fuel_tabs_plus: "" as number | "",
    o2_topoff: false,
    tks_topoff: false,
    gpu_required: false,
    hangar_pullout: true,
    cabin_provisioning: "",
    description: "",
  });

  // Fuel calculation
  const fuelPreview = useMemo(() => {
    const current = 0; // We don't have current fuel data in this view
    const full = 100; // Default usable fuel capacity
    const tabs = 60; // Default tabs level
    
    if (prepForm.fuel_target === 'ADD_QUANTITY') {
      const qty = typeof prepForm.fuel_add_quantity === 'number' ? prepForm.fuel_add_quantity : 0;
      return Math.max(0, Math.min(qty, full - current));
    }
    if (prepForm.fuel_target === 'FILL_TO_TABS') {
      return Math.max(0, tabs - current);
    }
    if (prepForm.fuel_target === 'FILL_TO_TABS_PLUS') {
      const plus = typeof prepForm.fuel_tabs_plus === 'number' ? prepForm.fuel_tabs_plus : 0;
      const goal = Math.min(tabs + plus, full);
      return Math.max(0, goal - current);
    }
    if (prepForm.fuel_target === 'FILL_TO_FULL') {
      return Math.max(0, full - current);
    }
    return 0;
  }, [prepForm.fuel_target, prepForm.fuel_add_quantity, prepForm.fuel_tabs_plus]);

  const [serviceForm, setServiceForm] = useState({
    type: "preflight",
    notes: "",
    requested_for: "",
  });

  const [instructionForm, setInstructionForm] = useState({
    instruction_type: "flight_instruction",
    requested_date: "",
    requested_time: "",
    notes: "",
  });

  useEffect(() => {
    if (aircraftData?.id && !prepForm.aircraft_id) {
      setPrepForm(f => ({ 
        ...f, 
        aircraft_id: aircraftData.id,
        airport: (aircraftData.base_location || "KAPA").toUpperCase()
      }));
    }
  }, [aircraftData]);

  const handlePrepareAircraft = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Actions are disabled in demo mode",
        variant: "default",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Build fuel request description
      let fuelDescription = "";
      if (prepForm.fuel_target === 'ADD_QUANTITY' && prepForm.fuel_add_quantity) {
        fuelDescription = `Fuel: Add ${prepForm.fuel_add_quantity} gallons`;
      } else if (prepForm.fuel_target === 'FILL_TO_TABS') {
        fuelDescription = "Fuel: Fill to Tabs";
      } else if (prepForm.fuel_target === 'FILL_TO_TABS_PLUS' && prepForm.fuel_tabs_plus) {
        fuelDescription = `Fuel: Fill to Tabs + ${prepForm.fuel_tabs_plus} gallons`;
      } else if (prepForm.fuel_target === 'FILL_TO_FULL') {
        fuelDescription = "Fuel: Fill to Full";
      }

      // Build description with all details including departure time
      const descriptionParts = [
        `Pre-Flight Concierge Request - ${prepForm.airport}`,
        prepForm.requested_departure ? `Departure: ${new Date(prepForm.requested_departure).toLocaleString()}` : null,
        fuelDescription,
        prepForm.o2_topoff ? "O₂ Top-off" : null,
        prepForm.tks_topoff ? "TKS Top-off" : null,
        prepForm.gpu_required ? "GPU Required" : null,
        prepForm.hangar_pullout ? "Hangar Pull-out" : null,
        prepForm.cabin_provisioning ? `Provisioning: ${prepForm.cabin_provisioning}` : null,
        prepForm.description ? `Notes: ${prepForm.description}` : null,
      ].filter(Boolean).join(" | ");

      const requestedDepartureIso = prepForm.requested_departure
        ? (() => {
            const parsed = new Date(prepForm.requested_departure);
            return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
          })()
        : null;

      const payload: any = {
        service_type: "Pre-Flight Concierge",
        priority: "high",
        status: "pending",
        user_id: userId,
        aircraft_id: prepForm.aircraft_id,
        description: descriptionParts,
        airport: prepForm.airport || null,
        requested_departure: requestedDepartureIso,
        cabin_provisioning: prepForm.cabin_provisioning
          ? { notes: prepForm.cabin_provisioning }
          : null,
        o2_topoff: prepForm.o2_topoff,
        tks_topoff: prepForm.tks_topoff,
        gpu_required: prepForm.gpu_required,
        hangar_pullout: prepForm.hangar_pullout,
      };
      
      if (prepForm.fuel_target === "ADD_QUANTITY" && typeof prepForm.fuel_add_quantity === "number") {
        payload.fuel_quantity = prepForm.fuel_add_quantity;
      }
      
      console.log("Submitting payload:", payload);
      const { data, error } = await supabase.from("service_requests").insert(payload).select();
      console.log("Insert response:", { data, error });
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Pre-flight request submitted successfully!",
      });
      
      setOpenPrep(false);
      setPrepForm({
        aircraft_id: aircraftData?.id || "",
        airport: aircraftData?.base_location?.toUpperCase() || "",
        requested_departure: "",
        fuel_target: "ADD_QUANTITY",
        fuel_add_quantity: "",
        fuel_tabs_plus: "",
        o2_topoff: false,
        tks_topoff: false,
        gpu_required: false,
        hangar_pullout: true,
        cabin_provisioning: "",
        description: "",
      });
      
      // Invalidate all service request queries (both client and staff dashboard queries)
      await queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "service-requests" || 
          query.queryKey[0] === "/api/service-requests"
      });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "service-tasks"
      });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "next-flight"
      });
    } catch (error) {
      console.error("Error submitting pre-flight request:", error);
      toast({
        title: "Error",
        description: "Failed to submit pre-flight request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Actions are disabled in demo mode",
        variant: "default",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Parse datetime-local format to separate date and time if provided
      let requestedDeparture: string | null = null;
      
      if (serviceForm.requested_for) {
        // Format: "2024-01-15T14:30"
        const parsed = new Date(serviceForm.requested_for);
        requestedDeparture = Number.isNaN(parsed.getTime())
          ? null
          : parsed.toISOString();
      }

      const { error } = await supabase.from("service_requests").insert({
        aircraft_id: aircraftId,
        user_id: userId,
        service_type: serviceForm.type,
        description: serviceForm.notes || `Service request: ${serviceForm.type}`,
        status: "pending",
        priority: "medium",
        requested_departure: requestedDeparture,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service request submitted!",
      });
      
      setOpenService(false);
      setServiceForm({
        type: "preflight",
        notes: "",
        requested_for: "",
      });
      
      // Invalidate all service request queries (both client and staff dashboard queries)
      await queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "service-requests" || 
          query.queryKey[0] === "/api/service-requests"
      });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "service-tasks"
      });
    } catch (error) {
      console.error("Error requesting service:", error);
      toast({
        title: "Error",
        description: "Failed to submit service request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Actions are disabled in demo mode",
        variant: "default",
      });
      return;
    }
    
    if (!instructionForm.requested_date || !instructionForm.requested_time) {
      toast({
        title: "Missing fields",
        description: "Please select a date and time for your flight instruction.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Build description with instruction details
      const descriptionParts = [
        `Flight Instruction Request - ${instructionForm.instruction_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        `Preferred Date: ${new Date(instructionForm.requested_date).toLocaleDateString()}`,
        `Preferred Time: ${instructionForm.requested_time}`,
        instructionForm.notes ? `Notes: ${instructionForm.notes}` : null,
      ].filter(Boolean).join(" | ");

      // Build requested_departure in ISO format for consistency
      const requestedDeparture = instructionForm.requested_date && instructionForm.requested_time
        ? (() => {
            const parsed = new Date(`${instructionForm.requested_date}T${instructionForm.requested_time}`);
            return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
          })()
        : null;

      const payload: any = {
        service_type: "Flight Instruction",
        priority: "medium",
        status: "pending",
        user_id: userId,
        aircraft_id: aircraftId,
        description: descriptionParts,
        requested_departure: requestedDeparture,
      };
      
      const { data, error } = await supabase.from("service_requests").insert(payload).select();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Flight instruction request submitted successfully!",
      });
      
      setOpenInstruction(false);
      setInstructionForm({
        instruction_type: "flight_instruction",
        requested_date: "",
        requested_time: "",
        notes: "",
      });
      
      // Invalidate all service request queries (both client and staff dashboard queries)
      await queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "service-requests" || 
          query.queryKey[0] === "/api/service-requests"
      });
    } catch (error) {
      console.error("Error submitting flight instruction request:", error);
      toast({
        title: "Error",
        description: "Failed to submit flight instruction request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Dialog open={openPrep} onOpenChange={setOpenPrep}>
          <DialogTrigger asChild>
            <Button 
              variant="default" 
              size="lg"
              className="w-full h-24 flex flex-col gap-2 bg-primary hover:bg-primary/90" 
              data-testid="button-prepare-aircraft"
              aria-label="Prepare my aircraft"
              onClick={() => setOpenPrep(true)}
            >
              <Plane className="h-8 w-8" />
              <span className="text-base font-semibold">Prepare My Aircraft</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" aria-label="Prepare Aircraft Dialog">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl">Prepare Aircraft</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                  {aircraftData?.tail_number || "N/A"}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {prepForm.airport || "KAPA"}
                </Badge>
              </div>
            </DialogHeader>
            
            <form onSubmit={handlePrepareAircraft} className="space-y-6 mt-4">
              {/* Section A: Flight Schedule */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Calendar className="h-4 w-4" />
                  Flight Schedule
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prep_departure" className="text-sm font-medium">Requested Departure *</Label>
                  <Input
                    id="prep_departure"
                    type="datetime-local"
                    value={prepForm.requested_departure}
                    onChange={(e) => setPrepForm({ ...prepForm, requested_departure: e.target.value })}
                    required
                    className="text-base"
                    data-testid="input-prep-departure"
                  />
                </div>
              </div>

              {/* Section B: Fuel Requirements */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Fuel className="h-4 w-4" />
                  Fuel Requirements
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Card 1: Fill to Full */}
                  <button
                    type="button"
                    onClick={() => setPrepForm({ ...prepForm, fuel_target: 'FILL_TO_FULL' })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      prepForm.fuel_target === 'FILL_TO_FULL'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${
                        prepForm.fuel_target === 'FILL_TO_FULL' ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        <Battery className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Fill to Full</div>
                        <div className="text-xs text-muted-foreground">100% capacity</div>
                      </div>
                    </div>
                  </button>

                  {/* Card 2: Fill to Tabs */}
                  <button
                    type="button"
                    onClick={() => setPrepForm({ ...prepForm, fuel_target: 'FILL_TO_TABS' })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      prepForm.fuel_target === 'FILL_TO_TABS'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${
                        prepForm.fuel_target === 'FILL_TO_TABS' ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        <Droplets className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Fill to Tabs</div>
                        <div className="text-xs text-muted-foreground">Standard level</div>
                      </div>
                    </div>
                  </button>

                  {/* Card 3: Tabs Plus */}
                  <button
                    type="button"
                    onClick={() => setPrepForm({ ...prepForm, fuel_target: 'FILL_TO_TABS_PLUS' })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      prepForm.fuel_target === 'FILL_TO_TABS_PLUS'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${
                          prepForm.fuel_target === 'FILL_TO_TABS_PLUS' ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          <Fuel className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Tabs Plus</div>
                          <div className="text-xs text-muted-foreground">Tabs + extra</div>
                        </div>
                      </div>
                      {prepForm.fuel_target === 'FILL_TO_TABS_PLUS' && (
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          value={prepForm.fuel_tabs_plus}
                          onChange={(e) => setPrepForm({ ...prepForm, fuel_tabs_plus: e.target.value === '' ? '' : Number(e.target.value) })}
                          placeholder="Additional gallons"
                          className="text-sm"
                          data-testid="input-fuel-tabs-plus"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </button>

                  {/* Card 4: Specific Amount */}
                  <button
                    type="button"
                    onClick={() => setPrepForm({ ...prepForm, fuel_target: 'ADD_QUANTITY' })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      prepForm.fuel_target === 'ADD_QUANTITY'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${
                          prepForm.fuel_target === 'ADD_QUANTITY' ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          <Fuel className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Specific Amount</div>
                          <div className="text-xs text-muted-foreground">Custom gallons</div>
                        </div>
                      </div>
                      {prepForm.fuel_target === 'ADD_QUANTITY' && (
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          value={prepForm.fuel_add_quantity}
                          onChange={(e) => setPrepForm({ ...prepForm, fuel_add_quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                          placeholder="Gallons to add"
                          className="text-sm"
                          data-testid="input-fuel-add"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </button>
                </div>
                <div className="text-xs text-muted-foreground px-1">
                  Estimated fuel to add: <span className="font-semibold">{fuelPreview.toFixed(1)} gallons</span>
                </div>
              </div>

              {/* Section C: Ground Services */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Zap className="h-4 w-4" />
                  Ground Services
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrepForm({ ...prepForm, hangar_pullout: !prepForm.hangar_pullout })}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      prepForm.hangar_pullout
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    data-testid="checkbox-hangar"
                  >
                    <Warehouse className={`h-5 w-5 ${prepForm.hangar_pullout ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Hangar Pull-out</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrepForm({ ...prepForm, gpu_required: !prepForm.gpu_required })}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      prepForm.gpu_required
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    data-testid="checkbox-gpu"
                  >
                    <Zap className={`h-5 w-5 ${prepForm.gpu_required ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">GPU</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrepForm({ ...prepForm, o2_topoff: !prepForm.o2_topoff })}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      prepForm.o2_topoff
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    data-testid="checkbox-o2"
                  >
                    <Wind className={`h-5 w-5 ${prepForm.o2_topoff ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">O₂ Service</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrepForm({ ...prepForm, tks_topoff: !prepForm.tks_topoff })}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      prepForm.tks_topoff
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    data-testid="checkbox-tks"
                  >
                    <Droplets className={`h-5 w-5 ${prepForm.tks_topoff ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">TKS Fluid</span>
                  </button>
                </div>
              </div>

              {/* Section D: Concierge & Notes */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="prep_provisioning" className="text-sm font-medium">Cabin Provisioning</Label>
                  <Textarea
                    id="prep_provisioning"
                    placeholder="Coffee, ice, catering, water bottles..."
                    value={prepForm.cabin_provisioning}
                    onChange={(e) => setPrepForm({ ...prepForm, cabin_provisioning: e.target.value })}
                    className="resize-none border-slate-200 dark:border-slate-800 focus:border-primary"
                    rows={2}
                    data-testid="textarea-provisioning"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prep_description" className="text-sm font-medium">Additional Notes</Label>
                  <Textarea
                    id="prep_description"
                    placeholder="Any special requests or instructions..."
                    value={prepForm.description}
                    onChange={(e) => setPrepForm({ ...prepForm, description: e.target.value })}
                    className="resize-none border-slate-200 dark:border-slate-800 focus:border-primary"
                    rows={2}
                    data-testid="textarea-notes"
                  />
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className="flex gap-3 sm:gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setOpenPrep(false)} 
                  className="flex-1 sm:flex-initial"
                  data-testid="button-cancel-prep"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 sm:flex-1"
                  data-testid="button-submit-prep"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={openService} onOpenChange={setOpenService}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="lg"
              className="w-full h-24 flex flex-col gap-2 hover:bg-accent" 
              data-testid="button-request-service"
              aria-label="Request service"
              onClick={() => setOpenService(true)}
            >
              <Wrench className="h-8 w-8" />
              <span className="text-base font-semibold">Request Service</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" aria-label="Request Service Dialog">
            <DialogHeader>
              <DialogTitle>Request Service</DialogTitle>
              <DialogDescription>
                Submit a service request for your aircraft
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRequestService} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Service Type</Label>
                <Select
                  value={serviceForm.type}
                  onValueChange={(v) => setServiceForm({ ...serviceForm, type: v })}
                >
                  <SelectTrigger data-testid="select-service-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preflight">Pre-Flight Concierge</SelectItem>
                    <SelectItem value="full_detail">Full Detail</SelectItem>
                    <SelectItem value="oil">Oil Service</SelectItem>
                    <SelectItem value="o2">O₂ Service</SelectItem>
                    <SelectItem value="tks">TKS Service</SelectItem>
                    <SelectItem value="db_update">Database Update</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requested_for">Requested Time (Optional)</Label>
                <Input
                  id="requested_for"
                  type="datetime-local"
                  value={serviceForm.requested_for}
                  onChange={(e) => setServiceForm({ ...serviceForm, requested_for: e.target.value })}
                  data-testid="input-requested-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_notes">Notes</Label>
                <Textarea
                  id="service_notes"
                  placeholder="Describe what you need"
                  value={serviceForm.notes}
                  onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
                  data-testid="textarea-service-notes"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenService(false)} data-testid="button-cancel-service">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} data-testid="button-submit-service">
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={openInstruction} onOpenChange={setOpenInstruction}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="lg"
              className="w-full h-24 flex flex-col gap-2 hover:bg-accent" 
              data-testid="button-request-instruction"
              aria-label="Request flight instruction"
              onClick={() => setOpenInstruction(true)}
            >
              <GraduationCap className="h-8 w-8" />
              <span className="text-base font-semibold">Flight Instruction</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-label="Flight Instruction Dialog">
            <DialogHeader>
              <DialogTitle>Request Flight Instruction</DialogTitle>
              <DialogDescription>
                Request a flight instruction block with a CFI. Our team will coordinate scheduling.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRequestInstruction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instruction_type">Instruction Type *</Label>
                <Select
                  value={instructionForm.instruction_type}
                  onValueChange={(v) => setInstructionForm({ ...instructionForm, instruction_type: v })}
                >
                  <SelectTrigger id="instruction_type" data-testid="select-instruction-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flight_instruction">Flight Instruction</SelectItem>
                    <SelectItem value="ipc">IPC (Instrument Proficiency Check)</SelectItem>
                    <SelectItem value="bfr">BFR (Biennial Flight Review)</SelectItem>
                    <SelectItem value="checkout">Aircraft Checkout</SelectItem>
                    <SelectItem value="currency_training">Currency Training</SelectItem>
                    <SelectItem value="advanced_training">Advanced Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instruction_date">Preferred Date *</Label>
                  <Input
                    id="instruction_date"
                    type="date"
                    value={instructionForm.requested_date}
                    onChange={(e) => setInstructionForm({ ...instructionForm, requested_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    data-testid="input-instruction-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instruction_time">Preferred Time *</Label>
                  <Input
                    id="instruction_time"
                    type="time"
                    value={instructionForm.requested_time}
                    onChange={(e) => setInstructionForm({ ...instructionForm, requested_time: e.target.value })}
                    required
                    data-testid="input-instruction-time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instruction_notes">Additional Notes</Label>
                <Textarea
                  id="instruction_notes"
                  placeholder="Any specific requirements or goals for this instruction session..."
                  value={instructionForm.notes}
                  onChange={(e) => setInstructionForm({ ...instructionForm, notes: e.target.value })}
                  rows={4}
                  data-testid="textarea-instruction-notes"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenInstruction(false)} data-testid="button-cancel-instruction">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} data-testid="button-submit-instruction">
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
