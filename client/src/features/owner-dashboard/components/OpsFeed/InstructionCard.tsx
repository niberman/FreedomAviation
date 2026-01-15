import { NormalizedFeedItem } from "../../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Calendar, User } from "lucide-react";
import { format } from "date-fns";

export function InstructionCard({ item }: { item: NormalizedFeedItem }) {
  return (
    <Card className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100">{item.title}</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {format(new Date(item.date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-slate-700 text-slate-400 capitalize">
            {item.status}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Date: {item.metadata.requested_date ? format(new Date(item.metadata.requested_date), 'MMMM d, yyyy') : 'TBD'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <User className="h-3.5 w-3.5 text-indigo-500" />
            <span>Type: {item.metadata.instruction_type}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
