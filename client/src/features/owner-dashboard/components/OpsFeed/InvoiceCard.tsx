import { NormalizedFeedItem } from "../../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, CreditCard } from "lucide-react";
import { format } from "date-fns";

export function InvoiceCard({ item }: { item: NormalizedFeedItem }) {
  const isPaid = item.status === 'paid';

  return (
    <Card className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-colors border-l-4 border-l-indigo-500">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100">{item.title}</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {format(new Date(item.date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Badge variant={isPaid ? "default" : "outline"} className={isPaid ? "bg-emerald-500/20 text-emerald-400 border-none" : "border-amber-500/50 text-amber-500"}>
            {item.status}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-mono font-bold text-slate-100">
            <span className="text-sm text-slate-500 font-sans">$</span>
            {item.metadata.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          
          {item.metadata.hosted_invoice_url && (
            <a 
              href={item.metadata.hosted_invoice_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Pay Now
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
