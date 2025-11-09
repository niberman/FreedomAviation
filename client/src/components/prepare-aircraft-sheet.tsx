import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface PrepareAircraftSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraft: { id: string; tailNumber: string; make: string; model: string }; // include aircraft.id (uuid)
}

export function PrepareAircraftSheet({
  open,
  onOpenChange,
  aircraft,
}: PrepareAircraftSheetProps) {
  const [date, setDate] = useState<Date>();
  const [tasks, setTasks] = useState({
    staging: false,
    fuel: false,
    fluids: false,
    avionics: false,
  });
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  async function handleSubmit() {
    if (!date) {
      toast({
        title: "Select a date",
        description: "Please choose your flight date.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      // service_requests requires user_id (NOT NULL)
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userData?.user;
      if (!user) throw new Error("Please sign in to schedule preparation.");

      const description = [
        notes?.trim() || "",
        tasks.fuel ? "Fuel coordination requested (note-only)" : "",
        tasks.avionics ? "Avionics DB update requested" : "",
      ]
        .filter(Boolean)
        .join(" • ");

      // Format date and time for database fields
      const requestedDeparture = date.toISOString();

      const { error: insErr } = await supabase.from("service_requests").insert([
        {
          user_id: user.id,
          aircraft_id: aircraft.id,
          service_type: "Pre-Flight Concierge",
          description,
          priority: "medium",
          status: "pending",
          airport: "KAPA",
          requested_departure: requestedDeparture,
          hangar_pullout: tasks.staging,
          o2_topoff: tasks.fluids,
          tks_topoff: tasks.fluids,
          gpu_required: false,
          fuel_grade: null, // set later if you collect real fuel info
          fuel_quantity: null,
          cabin_provisioning: notes?.trim() ? { notes: notes.trim() } : null,
        },
      ]);

      if (insErr) throw insErr;

      toast({
        title: "Aircraft Preparation Scheduled",
        description: `Your ${aircraft.make} ${aircraft.model} will be ready for ${format(date, "PPP")}.`,
      });

      // Invalidate all service request queries (both client and staff dashboard queries)
      await queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey[0] === "service-requests" || 
          query.queryKey[0] === "/api/service-requests"
      });

      onOpenChange(false);
      setDate(undefined);
      setTasks({ staging: false, fuel: false, fluids: false, avionics: false });
      setNotes("");
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message ?? "Unable to schedule preparation.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Prepare Aircraft for Flight</SheetTitle>
          <SheetDescription>
            {aircraft.tailNumber} • {aircraft.make} {aircraft.model}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label>Flight Date & Time</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-select-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <Label>Preparation Tasks</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="staging"
                  checked={tasks.staging}
                  onCheckedChange={(c) => setTasks({ ...tasks, staging: !!c })}
                  data-testid="checkbox-staging"
                />
                <label htmlFor="staging" className="text-sm font-medium">
                  Stage on Ramp
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fuel"
                  checked={tasks.fuel}
                  onCheckedChange={(c) => setTasks({ ...tasks, fuel: !!c })}
                  data-testid="checkbox-fuel"
                />
                <label htmlFor="fuel" className="text-sm font-medium">
                  Fuel Coordination (note only)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fluids"
                  checked={tasks.fluids}
                  onCheckedChange={(c) => setTasks({ ...tasks, fluids: !!c })}
                  data-testid="checkbox-fluids"
                />
                <label htmlFor="fluids" className="text-sm font-medium">
                  Fluid Top-Offs (Oil, O₂, TKS)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="avionics"
                  checked={tasks.avionics}
                  onCheckedChange={(c) => setTasks({ ...tasks, avionics: !!c })}
                  data-testid="checkbox-avionics"
                />
                <label htmlFor="avionics" className="text-sm font-medium">
                  Avionics Database Update
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special requests or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="input-notes"
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={saving}
            data-testid="button-submit-prepare"
          >
            {saving ? "Scheduling..." : "Schedule Preparation"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
