'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Fuel, MapPin } from "lucide-react";

interface AircraftLike {
  tail_number: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  base_location?: string | null;
  hobbs_hours?: number | null;
  tach_hours?: number | null;
}

interface MembershipLike {
  tier?: string | null;
}

interface AircraftVitalsStripProps {
  aircraft: AircraftLike;
  membership?: MembershipLike | null;
  fuelLevel: number;
  isReady: boolean;
  readinessStatus: string;
}

export function AircraftVitalsStrip({
  aircraft,
  membership,
  fuelLevel,
  isReady,
  readinessStatus,
}: AircraftVitalsStripProps) {
  const aircraftLine = [aircraft.year, aircraft.make, aircraft.model]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex items-start justify-between gap-3 lg:flex-col lg:items-start lg:justify-center lg:min-w-[180px]">
            <div>
              <div className="text-2xl font-bold leading-tight" data-testid="text-aircraft-tail">
                {aircraft.tail_number}
              </div>
              {aircraftLine ? (
                <div className="text-xs text-muted-foreground">{aircraftLine}</div>
              ) : null}
            </div>
            <Badge
              variant={isReady ? "default" : "destructive"}
              className={isReady ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {isReady ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready to Fly
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {readinessStatus}
                </>
              )}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:flex-1 lg:gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Fuel className="h-3.5 w-3.5" />
                  Fuel
                </span>
                <span className="font-semibold text-foreground">{fuelLevel}%</span>
              </div>
              <Progress value={fuelLevel} className="h-1.5" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Hangar
              </div>
              <div className="text-sm font-semibold">
                {aircraft.base_location || "KAPA"}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">Hobbs</div>
              <div className="text-sm font-semibold">
                {aircraft.hobbs_hours != null ? `${aircraft.hobbs_hours.toFixed(1)} hrs` : "N/A"}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">Tach</div>
              <div className="text-sm font-semibold">
                {aircraft.tach_hours != null ? `${aircraft.tach_hours.toFixed(1)} hrs` : "N/A"}
              </div>
            </div>
          </div>

          {membership?.tier ? (
            <div className="lg:ml-auto">
              <Badge variant="secondary">{membership.tier} Member</Badge>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
