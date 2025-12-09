import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ServiceStatus, MaintenanceStatus } from "@/lib/types/database";

interface StatusPillProps {
  status: ServiceStatus | MaintenanceStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  // Service statuses
  pending: { label: "Pending", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  
  // Maintenance statuses
  current: { label: "Current", variant: "outline" },
  due_soon: { label: "Due Soon", variant: "secondary" },
  overdue: { label: "Overdue", variant: "destructive" },
  
  // Invoice statuses
  paid: { label: "Paid", variant: "outline" },
  unpaid: { label: "Unpaid", variant: "secondary" },
  overdue_invoice: { label: "Overdue", variant: "destructive" },
  
  // Readiness statuses
  ready: { label: "Ready", variant: "outline" },
  needs_service: { label: "Needs Service", variant: "secondary" },
};

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary" as const };

  return (
    <Badge 
      variant={config.variant} 
      className={cn("font-medium", className)}
      data-testid={`status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
