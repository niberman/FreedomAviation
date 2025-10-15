import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useState } from "react";

interface FreedomConfiguratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const classPricing = {
  class_i: { base: 200, name: "Class I", aircraft: "C182 / Archer / Cherokee" },
  class_ii: {
    base: 550,
    name: "Class II",
    aircraft: "SR22 / SR22T / DA40 / Mooney",
  },
  class_iii: { base: 1000, name: "Class III", aircraft: "Vision / TBM" },
};

const hourRanges = [
  {
    value: "0-10",
    label: "0-10 hours",
    multiplier: 1,
    details: "1 detail/month",
    readiness: "Weekly",
  },
  {
    value: "10-20",
    label: "10-20 hours",
    multiplier: 1.2,
    details: "2 details/month",
    readiness: "2x Weekly",
  },
  {
    value: "20-30",
    label: "20-30 hours",
    multiplier: 1.5,
    details: "3 details/month",
    readiness: "3x Weekly",
  },
  {
    value: "30-40",
    label: "30-40 hours",
    multiplier: 1.8,
    details: "4 details/month",
    readiness: "Daily",
  },
  {
    value: "40+",
    label: "40+ hours",
    multiplier: 2.0,
    details: "On-demand",
    readiness: "On-demand",
  },
];

export function FreedomConfigurator({
  open,
  onOpenChange,
}: FreedomConfiguratorProps) {
  const [aircraftClass, setAircraftClass] =
    useState<keyof typeof classPricing>("class_ii");
  const [hourRange, setHourRange] = useState("10-20");
  const [concierge, setConcierge] = useState(false);

  const selectedClass = classPricing[aircraftClass];
  const selectedRange =
    hourRanges.find((r) => r.value === hourRange) || hourRanges[1];
  const basePrice = selectedClass.base * selectedRange.multiplier;
  const totalPrice = basePrice + (concierge ? 200 : 0);

  const alwaysIncluded = [
    "Fluid top-offs (Oil, O₂, TKS)",
    "Avionics database updates",
    "Pre/post-flight checks",
    "Ramp & hangar coordination",
    "Digital portal access",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Freedom Configurator</DialogTitle>
          <DialogDescription>
            Calculate your perfect membership plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label>Aircraft Class</Label>
            <RadioGroup
              value={aircraftClass}
              onValueChange={(v) =>
                setAircraftClass(v as keyof typeof classPricing)
              }
            >
              {Object.entries(classPricing).map(([key, value]) => (
                <label
                  key={key}
                  className={`flex items-center justify-between border rounded-md p-4 cursor-pointer hover-elevate ${
                    aircraftClass === key ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value={key}
                      id={key}
                      data-testid={`radio-${key}`}
                    />
                    <div>
                      <p className="font-semibold">{value.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {value.aircraft}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">${value.base}/mo base</Badge>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Estimated Monthly Hours</Label>
            <Select value={hourRange} onValueChange={setHourRange}>
              <SelectTrigger data-testid="select-hours">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hourRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="concierge"
                    checked={concierge}
                    onCheckedChange={(checked) => setConcierge(!!checked)}
                    data-testid="checkbox-concierge"
                  />
                  <label htmlFor="concierge" className="font-semibold">
                    Freedom+ Concierge
                  </label>
                </div>
                <Badge>+$200/mo</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Personalized service, priority scheduling, and dedicated support
              </p>
            </CardContent>
          </Card>

          <div className="border-t pt-4 space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Your Plan Includes</h4>
              <div className="grid grid-cols-1 gap-2 mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Check className="h-4 w-4" />
                  {selectedRange.readiness} readiness checks
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Check className="h-4 w-4" />
                  {selectedRange.details}
                </div>
              </div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Always Included:
              </p>
              <div className="grid grid-cols-1 gap-1">
                {alwaysIncluded.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="h-3 w-3" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 rounded-md p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Monthly Cost
                </p>
                <p className="text-3xl font-bold">${totalPrice.toFixed(0)}</p>
              </div>
              <Button size="lg" data-testid="button-select-plan">
                Select Plan
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
