import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plane,
  Fuel,
  Thermometer,
  MapPin,
  Plus,
  Bell,
  User,
  AlertCircle,
  CheckCircle2,
  Undo2,
} from "lucide-react";
import { format } from "date-fns";

interface RampJob {
  id: string;
  aircraft_id: string;
  aircraft?: {
    tail_number: string;
  };
  pull_out_time: string;
  services: string[]; // e.g., ["FUEL:40G", "HEAT", "STAGE"]
  status: "pending" | "staged" | "completed";
  priority: "normal" | "urgent";
  completed_at?: string;
  completed_by?: string;
  notes?: string;
}

export function RampDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"todo" | "done">("todo");
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [isIssueReportOpen, setIsIssueReportOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<RampJob | null>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch ramp jobs (using service_requests as the data source)
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["ramp-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select(`
          id,
          aircraft_id,
          status,
          requested_date,
          service_type,
          priority,
          notes,
          aircraft:aircraft_id(tail_number)
        `)
        .order("requested_date", { ascending: true });

      if (error) throw error;

      // Transform service requests into ramp jobs
      return (data || []).map((sr: any) => ({
        id: sr.id,
        aircraft_id: sr.aircraft_id,
        aircraft: sr.aircraft,
        pull_out_time: sr.requested_date,
        services: parseServices(sr.service_type, sr.notes),
        status: mapStatus(sr.status),
        priority: sr.priority === "high" ? "urgent" : "normal",
        notes: sr.notes,
      }));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("ramp-jobs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
        },
        (payload) => {
          console.log("🔴 Realtime update:", payload);
          queryClient.invalidateQueries({ queryKey: ["ramp-jobs"] });
          
          if (payload.eventType === "INSERT") {
            toast({
              title: "New Request!",
              description: "A new ramp job has been added",
            });
          }
        }
      )
      .subscribe((status) => {
        setIsOnline(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  // Mark job as staged mutation
  const markStagedMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("service_requests")
        .update({ 
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ramp-jobs"] });
      toast({
        title: "Job Completed",
        description: "Aircraft staged successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Undo completion mutation
  const undoCompletionMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("service_requests")
        .update({ 
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ramp-jobs"] });
      toast({
        title: "Undone",
        description: "Job moved back to pending",
      });
    },
  });

  const todoJobs = jobs.filter((job) => job.status === "pending" || job.status === "staged");
  const doneJobs = jobs.filter((job) => job.status === "completed");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Ramp Ops</h1>
            {/* Live status indicator */}
            <div className="relative">
              <div
                className={`h-2 w-2 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-gray-400"
                } ${isOnline ? "animate-pulse" : ""}`}
              />
            </div>
          </div>

          {/* Current time */}
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(currentTime, "EEE, MMM d")}
            </div>
            <div className="text-sm font-semibold">
              {format(currentTime, "HH:mm:ss")}
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-3">
            <button className="relative">
              <Bell className="h-5 w-5" />
              {todoJobs.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {todoJobs.length}
                </span>
              )}
            </button>
            <button>
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 max-w-2xl pb-24">
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="todo" className="relative">
              To Do
              {todoJobs.length > 0 && (
                <Badge className="ml-2 bg-blue-500">{todoJobs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>

          {/* To Do Tab */}
          <TabsContent value="todo" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : todoJobs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-gray-500">All caught up! No pending jobs.</p>
              </div>
            ) : (
              todoJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onMarkStaged={() => markStagedMutation.mutate(job.id)}
                  onReportIssue={() => {
                    setSelectedJob(job);
                    setIsIssueReportOpen(true);
                  }}
                />
              ))
            )}
          </TabsContent>

          {/* Done Tab */}
          <TabsContent value="done" className="space-y-4">
            {doneJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No completed jobs today
              </div>
            ) : (
              doneJobs.map((job) => (
                <CompletedJobCard
                  key={job.id}
                  job={job}
                  onUndo={() => undoCompletionMutation.mutate(job.id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddJobOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add Job Dialog */}
      <Dialog open={isAddJobOpen} onOpenChange={setIsAddJobOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ad-hoc Move</DialogTitle>
            <DialogDescription>
              Record a manual aircraft move or service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Aircraft Tail Number</Label>
              <Input placeholder="N123AB" />
            </div>
            <div>
              <Label>Action Taken</Label>
              <Textarea placeholder="Moved to wash bay, fueled 50 gallons, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddJobOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddJobOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Report Dialog */}
      <Dialog open={isIssueReportOpen} onOpenChange={setIsIssueReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Issue</DialogTitle>
            <DialogDescription>
              {selectedJob?.aircraft?.tail_number && `Aircraft: ${selectedJob.aircraft.tail_number}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Issue Description</Label>
              <Textarea placeholder="Describe the issue or squawk..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIssueReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsIssueReportOpen(false)}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Job Card Component
function JobCard({
  job,
  onMarkStaged,
  onReportIssue,
}: {
  job: RampJob;
  onMarkStaged: () => void;
  onReportIssue: () => void;
}) {
  const isUrgent = job.priority === "urgent";
  const borderColor = isUrgent ? "border-l-red-500" : "border-l-blue-500";

  return (
    <Card className={`border-l-4 ${borderColor} shadow-md`}>
      <div className="p-4 space-y-3">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-gray-500" />
            <span className="text-2xl font-bold">
              {job.aircraft?.tail_number || "Unknown"}
            </span>
          </div>
          <Badge className="bg-blue-600 text-white px-3 py-1 text-base">
            {format(new Date(job.pull_out_time), "HH:mm")}
          </Badge>
        </div>

        {/* Middle Row - Services */}
        <div className="flex flex-wrap gap-2">
          {job.services.map((service, idx) => (
            <ServiceBadge key={idx} service={service} />
          ))}
        </div>

        {/* Bottom Row - Actions */}
        <div className="space-y-2">
          <Button
            onClick={onMarkStaged}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
          >
            MARK STAGED
          </Button>
          <button
            onClick={onReportIssue}
            className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Report Issue
          </button>
        </div>

        {job.notes && (
          <div className="pt-2 border-t text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Notes:</span> {job.notes}
          </div>
        )}
      </div>
    </Card>
  );
}

// Completed Job Card
function CompletedJobCard({
  job,
  onUndo,
}: {
  job: RampJob;
  onUndo: () => void;
}) {
  return (
    <Card className="opacity-60 border-l-4 border-l-gray-400">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-xl font-bold line-through">
              {job.aircraft?.tail_number || "Unknown"}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {job.completed_at && format(new Date(job.completed_at), "HH:mm")}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {job.services.map((service, idx) => (
            <ServiceBadge key={idx} service={service} />
          ))}
        </div>

        {job.completed_by && (
          <div className="text-sm text-gray-500">
            Completed by {job.completed_by}
          </div>
        )}

        <Button
          onClick={onUndo}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Undo
        </Button>
      </div>
    </Card>
  );
}

// Service Badge Component
function ServiceBadge({ service }: { service: string }) {
  const getServiceStyle = (service: string) => {
    const upper = service.toUpperCase();
    if (upper.includes("FUEL")) {
      return {
        color: "bg-red-500 hover:bg-red-600",
        icon: <Fuel className="h-4 w-4" />,
      };
    }
    if (upper.includes("HEAT")) {
      return {
        color: "bg-orange-500 hover:bg-orange-600",
        icon: <Thermometer className="h-4 w-4" />,
      };
    }
    if (upper.includes("STAGE") || upper.includes("MOVE")) {
      return {
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <MapPin className="h-4 w-4" />,
      };
    }
    return {
      color: "bg-gray-500 hover:bg-gray-600",
      icon: <AlertCircle className="h-4 w-4" />,
    };
  };

  const style = getServiceStyle(service);

  return (
    <Badge
      className={`${style.color} text-white px-4 py-2 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors`}
    >
      {style.icon}
      {service}
    </Badge>
  );
}

// Helper functions
function parseServices(serviceType: string, notes?: string): string[] {
  const services: string[] = [];
  
  // Parse from service_type
  if (serviceType) {
    const types = serviceType.split(",").map(s => s.trim());
    types.forEach(type => {
      if (type.toLowerCase().includes("fuel")) {
        // Try to extract gallons from notes
        const gallons = notes?.match(/(\d+)\s*gal/i)?.[1];
        services.push(gallons ? `FUEL: ${gallons}G` : "FUEL");
      } else if (type.toLowerCase().includes("heat")) {
        services.push("HEAT");
      } else if (type.toLowerCase().includes("stage") || type.toLowerCase().includes("move")) {
        services.push("STAGE");
      } else {
        services.push(type.toUpperCase());
      }
    });
  }

  return services.length > 0 ? services : ["STAGE"];
}

function mapStatus(status: string): "pending" | "staged" | "completed" {
  const lower = status.toLowerCase();
  if (lower.includes("complete")) return "completed";
  if (lower.includes("stage") || lower.includes("progress")) return "staged";
  return "pending";
}

