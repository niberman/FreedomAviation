import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";

interface MaintenanceItem {
  id: string;
  tailNumber: string;
  title: string;
  hobbsDue?: number;
  hobbsCurrent?: number;
  calendarDue?: string;
  status: "ok" | "due_soon" | "overdue";
}

interface MaintenanceListProps {
  items?: MaintenanceItem[];
}

export function MaintenanceList({ items = [] }: MaintenanceListProps) {

  const getStatusBadge = (status: MaintenanceItem["status"]) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />OK</Badge>;
      case "due_soon":
        return <Badge className="bg-amber-500 text-white"><Clock className="h-3 w-3 mr-1" />Due Soon</Badge>;
      case "overdue":
        return <Badge className="bg-red-500 text-white"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-semibold">Maintenance Due</h3>
      <div className="space-y-2 sm:space-y-3">
        {items.map((item) => (
          <Card key={item.id} data-testid={`maintenance-${item.id}`} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.tailNumber}
                    </Badge>
                    {getStatusBadge(item.status)}
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2 leading-tight">{item.title}</h4>
                  <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground space-y-0.5">
                    {item.hobbsDue && (
                      <p className="leading-relaxed">Due at {item.hobbsDue} Hobbs{item.hobbsCurrent && ` (Current: ${item.hobbsCurrent})`}</p>
                    )}
                    {item.calendarDue && (
                      <p className="leading-relaxed">Due: {item.calendarDue}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
