import { Aircraft } from "@/shared/database-types";
import { AircraftOperationalStatus } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Fuel, MapPin, CheckCircle2, AlertCircle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlightLineHeroProps {
  aircraft: Aircraft;
  status: AircraftOperationalStatus;
  fuelLevel: number;
}

export function FlightLineHero({ aircraft, status, fuelLevel }: FlightLineHeroProps) {
  const isReady = status === 'READY TO FLY';
  const isGrounded = status === 'GROUNDED';
  const isMaintenance = status === 'MAINTENANCE';

  return (
    <Card className="overflow-hidden bg-slate-950 text-white border-slate-800 mb-6 shadow-2xl">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Left: Image & Identity */}
          <div className="relative h-72 lg:h-auto min-h-[350px]">
            <img
              src="/images/premium_cirrus_sr22t_b2f4f8b8.jpg"
              alt="Aircraft"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic text-indigo-500">
                  {aircraft.tail_number}
                </h2>
                <Badge 
                  className={cn(
                    "px-3 py-1 text-xs font-bold uppercase tracking-widest border-none shadow-lg",
                    isReady && "bg-emerald-500 shadow-emerald-500/20 animate-pulse",
                    isGrounded && "bg-red-500 shadow-red-500/20",
                    isMaintenance && "bg-amber-500 shadow-amber-500/20"
                  )}
                >
                  {isReady && <CheckCircle2 className="h-3 w-3 mr-1.5" />}
                  {isGrounded && <AlertCircle className="h-3 w-3 mr-1.5" />}
                  {isMaintenance && <Wrench className="h-3 w-3 mr-1.5" />}
                  {status}
                </Badge>
              </div>
              <p className="text-slate-400 font-medium">
                {aircraft.year} {aircraft.make} {aircraft.model}
              </p>
            </div>
          </div>

          {/* Right: Operational Vitals */}
          <div className="p-8 space-y-8 flex flex-col justify-center bg-slate-900/50 backdrop-blur-sm border-l border-slate-800">
            <div className="grid grid-cols-2 gap-8">
              {/* Fuel Vitals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                    <Fuel className="h-3.5 w-3.5 text-indigo-400" />
                    Fuel Status
                  </span>
                  <span className="text-sm font-mono text-indigo-300">{fuelLevel}%</span>
                </div>
                <Progress value={fuelLevel} className="h-1.5 bg-slate-800" indicatorClassName="bg-indigo-500" />
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Est. {Math.round(fuelLevel * 0.5)} Gallons Remaining</p>
              </div>

              {/* Location Vitals */}
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                  Base Station
                </span>
                <div className="text-2xl font-bold text-slate-200 tracking-tight">
                  {aircraft.base_location || "KAPA"}
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Centennial Airport</p>
              </div>
            </div>

            {/* Time Vitals */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Total Hobbs</div>
                <div className="text-2xl font-mono font-bold text-slate-100">
                  {aircraft.hobbs_hours?.toFixed(1) || "0.0"}<span className="text-sm text-slate-500 ml-1">HRS</span>
                </div>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Total Tach</div>
                <div className="text-2xl font-mono font-bold text-slate-100">
                  {aircraft.tach_hours?.toFixed(1) || "0.0"}<span className="text-sm text-slate-500 ml-1">HRS</span>
                </div>
              </div>
            </div>

            {/* Capability Badges */}
            <div className="flex gap-2">
              {aircraft.has_tks && (
                <Badge variant="outline" className="text-[9px] uppercase border-slate-700 text-slate-400 bg-slate-800/30">TKS Equipped</Badge>
              )}
              {aircraft.has_oxygen && (
                <Badge variant="outline" className="text-[9px] uppercase border-slate-700 text-slate-400 bg-slate-800/30">O2 Equipped</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
