import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { format } from "date-fns";

interface FlightLog {
  id: string;
  aircraft_id: string;
  pilot_id: string;
  date: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time?: string;
  arrival_time?: string;
  flight_hours: number;
  hobbs_start?: number;
  hobbs_end?: number;
  tach_start?: number;
  tach_end?: number;
  fuel_added?: number;
  oil_added?: number;
  notes?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  aircraft?: { tail_number: string };
  pilot?: { full_name: string; email: string };
  verifier?: { full_name: string };
}

interface FlightLogsListProps {
  aircraftId?: string;
}

export function FlightLogsList({ aircraftId }: FlightLogsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<FlightLog | null>(null);
  
  // Form state for new flight log
  const [formData, setFormData] = useState({
    aircraft_id: aircraftId || "",
    date: format(new Date(), "yyyy-MM-dd"),
    departure_airport: "",
    arrival_airport: "",
    departure_time: "",
    arrival_time: "",
    flight_hours: "",
    hobbs_start: "",
    hobbs_end: "",
    tach_start: "",
    tach_end: "",
    fuel_added: "",
    oil_added: "",
    notes: "",
  });

  // Fetch aircraft for dropdown
  const { data: aircraft = [] } = useQuery({
    queryKey: ["aircraft-for-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aircraft")
        .select("id, tail_number")
        .order("tail_number");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch flight logs
  const { data: flightLogs = [], isLoading, error: flightLogsError } = useQuery({
    queryKey: ["flight-logs", aircraftId],
    queryFn: async () => {
      let query = supabase
        .from("flight_logs")
        .select(`
          *,
          aircraft:aircraft_id(tail_number),
          pilot:pilot_id(full_name, email),
          verifier:verified_by(full_name)
        `)
        .order("date", { ascending: false })
        .order("departure_time", { ascending: false });
      
      if (aircraftId) {
        query = query.eq("aircraft_id", aircraftId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    retry: false,
  });

  // Create flight log mutation
  const createFlightLog = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      // Calculate flight hours from hobbs if not provided
      let flightHours = parseFloat(formData.flight_hours);
      if (!flightHours && formData.hobbs_start && formData.hobbs_end) {
        flightHours = parseFloat(formData.hobbs_end) - parseFloat(formData.hobbs_start);
      }
      
      if (!flightHours || flightHours <= 0) {
        throw new Error("Flight hours must be greater than 0");
      }
      
      const { data, error } = await supabase
        .from("flight_logs")
        .insert({
          aircraft_id: formData.aircraft_id,
          pilot_id: user.id,
          date: formData.date,
          departure_airport: formData.departure_airport.toUpperCase(),
          arrival_airport: formData.arrival_airport.toUpperCase(),
          departure_time: formData.departure_time || null,
          arrival_time: formData.arrival_time || null,
          flight_hours: flightHours,
          hobbs_start: formData.hobbs_start ? parseFloat(formData.hobbs_start) : null,
          hobbs_end: formData.hobbs_end ? parseFloat(formData.hobbs_end) : null,
          tach_start: formData.tach_start ? parseFloat(formData.tach_start) : null,
          tach_end: formData.tach_end ? parseFloat(formData.tach_end) : null,
          fuel_added: formData.fuel_added ? parseFloat(formData.fuel_added) : null,
          oil_added: formData.oil_added ? parseFloat(formData.oil_added) : null,
          notes: formData.notes || null,
          is_verified: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Flight log created",
        description: "The flight log has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["flight-logs"] });
      setShowAddDialog(false);
      // Reset form
      setFormData({
        aircraft_id: aircraftId || "",
        date: format(new Date(), "yyyy-MM-dd"),
        departure_airport: "",
        arrival_airport: "",
        departure_time: "",
        arrival_time: "",
        flight_hours: "",
        hobbs_start: "",
        hobbs_end: "",
        tach_start: "",
        tach_end: "",
        fuel_added: "",
        oil_added: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create flight log",
        variant: "destructive",
      });
    },
  });

  // Verify flight log mutation
  const verifyFlightLog = useMutation({
    mutationFn: async (logId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("flight_logs")
        .update({
          is_verified: true,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", logId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Flight log verified",
        description: "The flight log has been verified successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["flight-logs"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify flight log",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading flight logs...</p>
        </CardContent>
      </Card>
    );
  }

  // Show helpful message if flight_logs table doesn't exist yet
  if (flightLogsError && flightLogsError instanceof Error && flightLogsError.message.includes("does not exist")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flight Logs</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Flight logs feature not set up yet.</p>
          <p className="text-sm text-muted-foreground">
            Ask your administrator to run the <code className="text-xs bg-muted px-1 py-0.5 rounded">create-flight-logs-table.sql</code> script.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Flight Logs</h3>
            <p className="text-sm text-muted-foreground">
              Record and verify flight operations
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Flight Log
          </Button>
        </div>

        {flightLogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No flight logs recorded yet.</p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                Add First Flight Log
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {flightLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedLog(log)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {log.aircraft?.tail_number || "N/A"}
                        </CardTitle>
                        {log.is_verified ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.pilot?.full_name || log.pilot?.email || "Unknown Pilot"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{log.flight_hours.toFixed(1)} hrs</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{log.departure_airport} → {log.arrival_airport}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {log.departure_time || "--:--"} - {log.arrival_time || "--:--"}
                      </span>
                    </div>
                  </div>
                  {log.hobbs_start && log.hobbs_end && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Hobbs: {log.hobbs_start.toFixed(1)} → {log.hobbs_end.toFixed(1)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Flight Log Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Flight Log</DialogTitle>
            <DialogDescription>
              Record a flight entry for tracking and maintenance purposes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); createFlightLog.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aircraft">Aircraft *</Label>
                <Select
                  value={formData.aircraft_id}
                  onValueChange={(value) => setFormData({ ...formData, aircraft_id: value })}
                >
                  <SelectTrigger id="aircraft">
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraft.map((ac) => (
                      <SelectItem key={ac.id} value={ac.id}>
                        {ac.tail_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure_airport">Departure Airport *</Label>
                <Input
                  id="departure_airport"
                  value={formData.departure_airport}
                  onChange={(e) => setFormData({ ...formData, departure_airport: e.target.value.toUpperCase() })}
                  placeholder="KAPA"
                  maxLength={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrival_airport">Arrival Airport *</Label>
                <Input
                  id="arrival_airport"
                  value={formData.arrival_airport}
                  onChange={(e) => setFormData({ ...formData, arrival_airport: e.target.value.toUpperCase() })}
                  placeholder="KDEN"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure_time">Departure Time</Label>
                <Input
                  id="departure_time"
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrival_time">Arrival Time</Label>
                <Input
                  id="arrival_time"
                  type="time"
                  value={formData.arrival_time}
                  onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Engine Hours</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hobbs_start">Hobbs Start</Label>
                  <Input
                    id="hobbs_start"
                    type="number"
                    step="0.1"
                    value={formData.hobbs_start}
                    onChange={(e) => setFormData({ ...formData, hobbs_start: e.target.value })}
                    placeholder="1234.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hobbs_end">Hobbs End</Label>
                  <Input
                    id="hobbs_end"
                    type="number"
                    step="0.1"
                    value={formData.hobbs_end}
                    onChange={(e) => setFormData({ ...formData, hobbs_end: e.target.value })}
                    placeholder="1235.7"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="flight_hours">Flight Hours *</Label>
                <Input
                  id="flight_hours"
                  type="number"
                  step="0.1"
                  value={formData.flight_hours}
                  onChange={(e) => setFormData({ ...formData, flight_hours: e.target.value })}
                  placeholder="Auto-calculated from Hobbs or enter manually"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Will be calculated from Hobbs if not entered
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Consumables</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuel_added">Fuel Added (gal)</Label>
                  <Input
                    id="fuel_added"
                    type="number"
                    step="0.1"
                    value={formData.fuel_added}
                    onChange={(e) => setFormData({ ...formData, fuel_added: e.target.value })}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oil_added">Oil Added (qt)</Label>
                  <Input
                    id="oil_added"
                    type="number"
                    step="0.1"
                    value={formData.oil_added}
                    onChange={(e) => setFormData({ ...formData, oil_added: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any observations or issues during flight"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createFlightLog.isPending}>
                {createFlightLog.isPending ? "Creating..." : "Create Flight Log"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Flight Log Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Flight Log Details</DialogTitle>
              <DialogDescription>
                {selectedLog.aircraft?.tail_number} - {format(new Date(selectedLog.date), "MMMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pilot</p>
                  <p>{selectedLog.pilot?.full_name || selectedLog.pilot?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Flight Hours</p>
                  <p className="text-lg font-semibold">{selectedLog.flight_hours.toFixed(1)} hours</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Route</p>
                  <p>{selectedLog.departure_airport} → {selectedLog.arrival_airport}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Times</p>
                  <p>{selectedLog.departure_time || "--:--"} - {selectedLog.arrival_time || "--:--"}</p>
                </div>
              </div>

              {(selectedLog.hobbs_start || selectedLog.hobbs_end) && (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hobbs</p>
                    <p>
                      {selectedLog.hobbs_start?.toFixed(1) || "---"} → {selectedLog.hobbs_end?.toFixed(1) || "---"}
                    </p>
                  </div>
                  {(selectedLog.tach_start || selectedLog.tach_end) && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tach</p>
                      <p>
                        {selectedLog.tach_start?.toFixed(1) || "---"} → {selectedLog.tach_end?.toFixed(1) || "---"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(selectedLog.fuel_added || selectedLog.oil_added) && (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  {selectedLog.fuel_added && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fuel Added</p>
                      <p>{selectedLog.fuel_added.toFixed(1)} gallons</p>
                    </div>
                  )}
                  {selectedLog.oil_added && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Oil Added</p>
                      <p>{selectedLog.oil_added.toFixed(1)} quarts</p>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedLog.notes}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    {selectedLog.is_verified ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Verified</p>
                          <p className="text-xs text-muted-foreground">
                            by {selectedLog.verifier?.full_name} on{" "}
                            {selectedLog.verified_at && format(new Date(selectedLog.verified_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <p className="text-sm">Pending verification</p>
                      </div>
                    )}
                  </div>
                  {!selectedLog.is_verified && (
                    <Button
                      size="sm"
                      onClick={() => {
                        verifyFlightLog.mutate(selectedLog.id);
                        setSelectedLog(null);
                      }}
                      disabled={verifyFlightLog.isPending}
                    >
                      Verify Log
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
