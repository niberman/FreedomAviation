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

interface PrepareAircraftSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraft: {
    tailNumber: string;
    make: string;
    model: string;
  };
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

  const handleSubmit = () => {
    console.log("Prepare aircraft submitted:", { date, tasks, notes });
    // TODO: remove mock functionality - create readiness_tasks and service_requests

    toast({
      title: "Aircraft Preparation Scheduled",
      description: `Your ${aircraft.make} ${aircraft.model} will be ready for ${date ? format(date, "PPP") : "your selected date"}.`,
    });

    onOpenChange(false);
    setDate(undefined);
    setTasks({ staging: false, fuel: false, fluids: false, avionics: false });
    setNotes("");
  };

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
                  onCheckedChange={(checked) =>
                    setTasks({ ...tasks, staging: !!checked })
                  }
                  data-testid="checkbox-staging"
                />
                <label
                  htmlFor="staging"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Stage on Ramp
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fuel"
                  checked={tasks.fuel}
                  onCheckedChange={(checked) =>
                    setTasks({ ...tasks, fuel: !!checked })
                  }
                  data-testid="checkbox-fuel"
                />
                <label
                  htmlFor="fuel"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Fuel Coordination (note only)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fluids"
                  checked={tasks.fluids}
                  onCheckedChange={(checked) =>
                    setTasks({ ...tasks, fluids: !!checked })
                  }
                  data-testid="checkbox-fluids"
                />
                <label
                  htmlFor="fluids"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Fluid Top-Offs (Oil, O₂, TKS)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="avionics"
                  checked={tasks.avionics}
                  onCheckedChange={(checked) =>
                    setTasks({ ...tasks, avionics: !!checked })
                  }
                  data-testid="checkbox-avionics"
                />
                <label
                  htmlFor="avionics"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
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
            data-testid="button-submit-prepare"
          >
            Schedule Preparation
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
