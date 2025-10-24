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
import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);

type HourRangeValue = "0-10" | "10-25" | "25-40" | "40+";

interface FreedomConfiguratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const classPricing = {
  class_i: {
    base: 200,
    name: "Class I",
    aircraft: "C172 / C182 / Archer / Cherokee",
  },
  class_ii: {
    base: 550,
    name: "Class II",
    aircraft: "SR20 / SR22 / SR22T / DA40 / Mooney",
  },
  class_iii: { base: 1000, name: "Class III", aircraft: "Vision Jet / TBM" },
} as const;

const hourRanges: Array<{
  value: HourRangeValue;
  label: string;
  multiplier: number;
  details: string;
  readiness: string;
}> = [
  {
    value: "0-10",
    label: "0–10 hours",
    multiplier: 1.0,
    details: "1 full detail / month",
    readiness: "Weekly checks",
  },
  {
    value: "10-25",
    label: "10–25 hours",
    multiplier: 1.45,
    details: "2 full details / month",
    readiness: "Pre-/post-flight",
  },
  {
    value: "25-40",
    label: "25–40 hours",
    multiplier: 1.9,
    details: "3–4 full details / month",
    readiness: "Wipe after each flight + bi-weekly full",
  },
  {
    value: "40+",
    label: "40+ hours",
    multiplier: 2.2,
    details: "On-demand",
    readiness: "After every flight",
  },
];

const FREEDOM_PLUS_PRICE = 200;
const fmtUSD = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export function FreedomConfigurator({
  open,
  onOpenChange,
}: FreedomConfiguratorProps) {
  const [aircraftClass, setAircraftClass] =
    useState<keyof typeof classPricing>("class_ii");
  const [hourRange, setHourRange] = useState<HourRangeValue>("10-25");
  const [concierge, setConcierge] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedClass = classPricing[aircraftClass];
  const selectedRange = hourRanges.find((r) => r.value === hourRange)!;
  const basePrice = selectedClass.base * selectedRange.multiplier;
  const totalPrice = Math.round(
    basePrice + (concierge ? FREEDOM_PLUS_PRICE : 0),
  );

  const alwaysIncluded = [
    "Fluid top-offs (Oil, O₂, TKS)",
    "Avionics database updates",
    "Pre-/post-flight checks",
    "Ramp & hangar coordination",
    "Digital portal access",
  ];

  async function handleSelectPlan() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // support_tickets requires owner_id (NOT NULL)
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userData?.user;
      if (!user) {
        throw new Error("Please sign in to submit your membership request.");
      }

      const payload = {
        aircraft_class: aircraftClass, // 'class_i' | 'class_ii' | 'class_iii'
        hour_range: hourRange, // '0-10' | '10-25' | '25-40' | '40+'
        concierge,
        quoted_price: totalPrice,
      };

      const { error: insErr } = await supabase.from("support_tickets").insert([
        {
          owner_id: user.id,
          subject: "Membership request",
          body: JSON.stringify(payload),
          status: "open",
        },
      ]);
      if (insErr) throw insErr;

      setSuccess("Request sent. We’ll reach out to finalize your membership.");
      setTimeout(() => onOpenChange(false), 900);
    } catch (e: any) {
      setError(e?.message ?? "Unable to save your selection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Freedom Configurator</DialogTitle>
          <DialogDescription>
            Transparent pricing aligned to service level and hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Aircraft Class */}
          <div className="space-y-3">
            <Label>Aircraft Class</Label>
            <RadioGroup
              value={aircraftClass}
              onValueChange={(v) =>
                setAircraftClass(v as keyof typeof classPricing)
              }
              className="space-y-3"
            >
              {Object.entries(classPricing).map(([key, value]) => {
                const active = aircraftClass === key;
                return (
                  <label
                    key={key}
                    className={`flex items-center justify-between border rounded-md p-4 cursor-pointer transition ${active ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-muted/40"}`}
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
                    <Badge variant="secondary">
                      {fmtUSD(value.base)}/mo base
                    </Badge>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Hours */}
          <div className="space-y-2">
            <Label>Estimated Monthly Hours</Label>
            <Select
              value={hourRange}
              onValueChange={(v: HourRangeValue) => setHourRange(v)}
            >
              <SelectTrigger data-testid="select-hours">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hourRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label} · ×{range.multiplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Freedom+ */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="concierge"
                    checked={concierge}
                    onCheckedChange={(c) => setConcierge(Boolean(c))}
                    data-testid="checkbox-concierge"
                  />
                  <label htmlFor="concierge" className="font-semibold">
                    Freedom+ Concierge
                  </label>
                </div>
                <Badge>+{fmtUSD(FREEDOM_PLUS_PRICE)}/mo</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                24-hour SLA, cabin provisioning, trip planning & priority
                support.
              </p>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="border-t pt-4 space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Your Plan Includes</h4>
              <div className="grid grid-cols-1 gap-2 mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Check className="h-4 w-4" />
                  {selectedRange.readiness}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Check className="h-4 w-4" />
                  {selectedRange.details}
                </div>
              </div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Always Included
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
                <p className="text-3xl font-bold">{fmtUSD(totalPrice)}</p>
              </div>
              <Button
                size="lg"
                data-testid="button-select-plan"
                onClick={handleSelectPlan}
                disabled={saving}
              >
                {saving ? "Saving..." : "Select Plan"}
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
