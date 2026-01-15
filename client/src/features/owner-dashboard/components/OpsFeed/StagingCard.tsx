import { NormalizedFeedItem } from "../../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaneTakeoff, Fuel, Clock, Coffee } from "lucide-react";
import { format } from "date-fns";

export function StagingCard({ item }: { item: NormalizedFeedItem }) {
  const { metadata } = item;
  const provisioning = metadata.cabin_provisioning || {};
  const amenities = Object.entries(provisioning)
    .filter(([_, value]) => value === true)
    .map(([key]) => key.replace('_', ' '));

  return (
    <Card className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <PlaneTakeoff className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100">{item.title}</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {format(new Date(item.date), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-slate-700 text-slate-400 capitalize">
            {item.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Dept: {metadata.requested_departure ? format(new Date(metadata.requested_departure), 'h:mm a') : 'TBD'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Fuel className="h-3.5 w-3.5 text-slate-500" />
            <span>Fuel: {metadata.fuel_quantity} gal ({metadata.fuel_grade})</span>
          </div>
          {amenities.length > 0 && (
            <div className="col-span-2 flex items-start gap-2 text-xs text-slate-400">
              <Coffee className="h-3.5 w-3.5 text-slate-500 mt-0.5" />
              <span className="capitalize">{amenities.join(', ')} requested</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
