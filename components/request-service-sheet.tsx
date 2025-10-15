import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Sparkles,
  Database,
  Droplet,
  Wind,
  Wrench,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface RequestServiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraft: {
    tailNumber: string;
    make: string;
    model: string;
  };
}

const serviceTypes = [
  { value: "detail", label: "Full Detail", icon: Sparkles },
  { value: "db_update", label: "Database Update", icon: Database },
  { value: "o2", label: "O₂ Service", icon: Wind },
  { value: "tks", label: "TKS Fluid", icon: Droplet },
  { value: "oil", label: "Oil Service", icon: Droplet },
  { value: "staging", label: "Aircraft Staging", icon: Wrench },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "other", label: "Other Service", icon: Wrench },
];

export function RequestServiceSheet({
  open,
  onOpenChange,
  aircraft,
}: RequestServiceSheetProps) {
  const [serviceType, setServiceType] = useState("detail");
  const [date, setDate] = useState<Date>();
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    console.log("Service request submitted:", { serviceType, date, notes });
    // TODO: remove mock functionality - create service_requests record

    const selectedService = serviceTypes.find((s) => s.value === serviceType);
    toast({
      title: "Service Request Submitted",
      description: `${selectedService?.label} scheduled for ${aircraft.tailNumber}`,
    });

    onOpenChange(false);
    setServiceType("detail");
    setDate(undefined);
    setNotes("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Request Service</SheetTitle>
          <SheetDescription>
            {aircraft.tailNumber} • {aircraft.make} {aircraft.model}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-3">
            <Label>Service Type</Label>
            <RadioGroup value={serviceType} onValueChange={setServiceType}>
              <div className="grid grid-cols-2 gap-3">
                {serviceTypes.map((service) => (
                  <label
                    key={service.value}
                    className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover-elevate ${
                      serviceType === service.value
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <RadioGroupItem
                      value={service.value}
                      id={service.value}
                      data-testid={`radio-${service.value}`}
                    />
                    <service.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{service.label}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Requested Date & Time</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-select-service-date"
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

          <div className="space-y-2">
            <Label htmlFor="service-notes">Notes</Label>
            <Textarea
              id="service-notes"
              placeholder="Additional details or special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="input-service-notes"
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            data-testid="button-submit-service"
          >
            Submit Request
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
