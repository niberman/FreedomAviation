import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Fuel, Droplet, Wind, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { ServiceRequest } from "@shared/database-types";

interface RampJobCardProps {
  request: ServiceRequest & {
    aircraft?: {
      tail_number: string;
    };
    owner?: {
      full_name?: string;
      email?: string;
    };
  };
  onMarkStaged?: (requestId: string) => void;
  onViewDetails?: (requestId: string) => void;
  isLoading?: boolean;
}

const getServiceTypeIcon = (type: string) => {
  const icons: Record<string, React.ElementType> = {
    detail: CheckCircle2,
    db_update: AlertCircle,
    o2: Wind,
    tks: Droplet,
    oil: Droplet,
    staging: CheckCircle2,
    maintenance: AlertCircle,
    "Pre-Flight Concierge": CheckCircle2,
    other: AlertCircle
  };
  return icons[type] || AlertCircle;
};

const getServiceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    detail: "Full Detail",
    db_update: "Database Update",
    o2: "O₂ Service",
    tks: "TKS Fluid",
    oil: "Oil Service",
    staging: "Aircraft Staging",
    maintenance: "Maintenance",
    "Pre-Flight Concierge": "Pre-Flight Concierge",
    other: "Other Service"
  };
  return labels[type] || type;
};

const getPriorityColor = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    case "high":
      return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
    case "normal":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  }
};

export function RampJobCard({ request, onMarkStaged, onViewDetails, isLoading }: RampJobCardProps) {
  const ServiceIcon = getServiceTypeIcon(request.service_type);
  
  const formatRequestTime = () => {
    if (request.requested_departure) {
      const date = new Date(request.requested_departure);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
    return "TBD";
  };

  const ownerDisplay = request.owner?.full_name || request.owner?.email || "Unknown Owner";

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4 pb-3 bg-muted/30 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <ServiceIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate">
                {request.aircraft?.tail_number || "N/A"}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {getServiceTypeLabel(request.service_type)}
              </p>
            </div>
          </div>
          {request.priority && (
            <Badge 
              variant="secondary" 
              className={getPriorityColor(request.priority)}
            >
              {request.priority}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Owner Info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{ownerDisplay}</span>
        </div>

        {/* Requested Time */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">{formatRequestTime()}</span>
        </div>

        {/* Airport */}
        {request.airport && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-xs bg-muted px-2 py-1 rounded">
              {request.airport}
            </span>
          </div>
        )}

        {/* Service Details */}
        {(request.fuel_grade || request.o2_topoff || request.tks_topoff) && (
          <div className="space-y-2 pt-2 border-t">
            {request.fuel_grade && request.fuel_quantity && (
              <div className="flex items-center gap-2 text-sm">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {request.fuel_grade}: {request.fuel_quantity} gal
                </span>
              </div>
            )}
            {request.o2_topoff && (
              <div className="flex items-center gap-2 text-sm">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">O₂ Top-off</span>
              </div>
            )}
            {request.tks_topoff && (
              <div className="flex items-center gap-2 text-sm">
                <Droplet className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">TKS Top-off</span>
              </div>
            )}
          </div>
        )}

        {/* Description/Notes */}
        {request.description && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {request.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            size="lg"
            className="w-full h-12 text-base font-semibold"
            onClick={() => onMarkStaged?.(request.id)}
            disabled={isLoading}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Mark Staged
          </Button>
          <Button
            size="default"
            variant="outline"
            className="w-full"
            onClick={() => onViewDetails?.(request.id)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

