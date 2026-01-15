import { NormalizedFeedItem } from "../../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Hammer, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function SquawkCard({ item }: { item: NormalizedFeedItem }) {
  const isHigh = item.metadata.priority === 'high';

  return (
    <Card className={cn(
      "bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-colors",
      isHigh && "border-l-4 border-l-red-500"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isHigh ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
            )}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100">{item.title}</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {format(new Date(item.date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn(
            "border-slate-700 capitalize",
            isHigh ? "text-red-400 border-red-900/30" : "text-amber-400 border-amber-900/30"
          )}>
            {item.status}
          </Badge>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4 italic">
          "{item.description}"
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">
            <Hammer className="h-3 w-3" />
            Priority: {item.metadata.priority}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
