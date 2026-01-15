import { Card, CardContent } from "@/components/ui/card";
import { PlaneTakeoff, AlertTriangle, GraduationCap, FileText, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ActionGridProps {
  onStagingClick: () => void;
  onSquawkClick: () => void;
  onInstructionClick: () => void;
}

export function ActionGrid({ onStagingClick, onSquawkClick, onInstructionClick }: ActionGridProps) {
  const actions = [
    {
      title: "Request Staging",
      description: "Fuel, provisioning & hangar pullout",
      icon: PlaneTakeoff,
      onClick: onStagingClick,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "hover:border-emerald-500/50",
    },
    {
      title: "Report Issue",
      description: "Log a new squawk or maintenance item",
      icon: AlertTriangle,
      onClick: onSquawkClick,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "hover:border-amber-500/50",
    },
    {
      title: "Book Instructor",
      description: "Schedule flight or ground training",
      icon: GraduationCap,
      onClick: onInstructionClick,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "hover:border-indigo-500/50",
    },
    {
      title: "Docs & Logs",
      description: "View aircraft documents and flight logs",
      icon: FileText,
      href: "/dashboard/documents",
      color: "text-slate-400",
      bg: "bg-slate-400/10",
      border: "hover:border-slate-400/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {actions.map((action) => {
        const Content = (
          <Card 
            key={action.title}
            className={cn(
              "group cursor-pointer transition-all duration-300 bg-slate-900/40 border-slate-800 backdrop-blur-sm overflow-hidden",
              action.border
            )}
            onClick={action.onClick}
          >
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className={cn("p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110", action.bg)}>
                  <action.icon className={cn("h-6 w-6", action.color)} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-100 flex items-center justify-between">
                    {action.title}
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

        return action.href ? (
          <Link key={action.title} href={action.href}>
            {Content}
          </Link>
        ) : Content;
      })}
    </div>
  );
}
