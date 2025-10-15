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

export function MaintenanceList() {
  // TODO: remove mock functionality
  const items: MaintenanceItem[] = [
    {
      id: "1",
      tailNumber: "N847SR",
      title: "Annual Inspection",
      calendarDue: "2024-11-15",
      status: "due_soon",
    },
    {
      id: "2",
      tailNumber: "N123JA",
      title: "100 Hour Inspection",
      hobbsDue: 1250,
      hobbsCurrent: 1180,
      status: "ok",
    },
    {
      id: "3",
      tailNumber: "N456AB",
      title: "Oil Change",
      hobbsDue: 850,
      hobbsCurrent: 852,
      status: "overdue",
    },
  ];

  const getStatusBadge = (status: MaintenanceItem["status"]) => {
    switch (status) {
      case "ok":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            OK
          </Badge>
        );
      case "due_soon":
        return (
          <Badge className="bg-amber-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Due Soon
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Maintenance Due</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} data-testid={`maintenance-${item.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono">
                      {item.tailNumber}
                    </Badge>
                    {getStatusBadge(item.status)}
                  </div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {item.hobbsDue && (
                      <p>
                        Due at {item.hobbsDue} Hobbs
                        {item.hobbsCurrent &&
                          ` (Current: ${item.hobbsCurrent})`}
                      </p>
                    )}
                    {item.calendarDue && <p>Due: {item.calendarDue}</p>}
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
