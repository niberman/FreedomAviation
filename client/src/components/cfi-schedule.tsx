import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, User, MapPin, Plus, RefreshCw, Calendar as CalendarIcon, Link2, Unlink } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ScheduleSlot {
  id: string;
  cfi_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "blocked";
  owner_id?: string;
  aircraft_id?: string;
  notes?: string;
  created_at: string;
  cfi?: { full_name: string; email: string };
  owner?: { full_name: string; email: string };
  aircraft?: { tail_number: string };
}

export function CFISchedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "09:00",
    end_time: "10:00",
    status: "available" as const,
    notes: "",
  });

  // Check Google Calendar connection status
  const { data: calendarStatus, refetch: refetchCalendarStatus } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return { connected: false, syncEnabled: false };

      const response = await fetch("/api/google-calendar/status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch calendar status");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch CFIs
  const { data: cfis = [] } = useQuery({
    queryKey: ["cfis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .in("role", ["cfi", "admin"])
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch schedule slots
  const { data: scheduleSlots = [], isLoading } = useQuery({
    queryKey: ["cfi-schedule", selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      
      const { data, error } = await supabase
        .from("cfi_schedule")
        .select(`
          *,
          cfi:cfi_id(full_name, email),
          owner:owner_id(full_name, email),
          aircraft:aircraft_id(tail_number)
        `)
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"))
        .order("date")
        .order("start_time");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedDate,
  });

  // Create schedule slot
  const createSlot = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("cfi_schedule")
        .insert({
          cfi_id: user.id,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          status: formData.status,
          notes: formData.notes || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Schedule slot created",
        description: "Your availability has been added to the schedule.",
      });
      queryClient.invalidateQueries({ queryKey: ["cfi-schedule"] });
      setShowAddDialog(false);
      // Reset form
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        start_time: "09:00",
        end_time: "10:00",
        status: "available",
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create schedule slot",
        variant: "destructive",
      });
    },
  });

  // Update slot status
  const updateSlotStatus = useMutation({
    mutationFn: async ({ slotId, status }: { slotId: string; status: ScheduleSlot["status"] }) => {
      const { error } = await supabase
        .from("cfi_schedule")
        .update({ status })
        .eq("id", slotId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Schedule updated",
        description: "The schedule slot has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["cfi-schedule"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update schedule",
        variant: "destructive",
      });
    },
  });

  // Connect to Google Calendar
  const connectGoogleCalendar = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch("/api/google-calendar/auth-url", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to get authorization URL");
      const data = await response.json();
      return data.authUrl;
    },
    onSuccess: (authUrl) => {
      // Open Google OAuth in new window
      window.open(authUrl, "_blank", "width=600,height=800");
      
      // Poll for connection status
      const pollInterval = setInterval(async () => {
        const result = await refetchCalendarStatus();
        if (result.data?.connected) {
          clearInterval(pollInterval);
          toast({
            title: "Google Calendar Connected",
            description: "Your availability will now sync with Google Calendar.",
          });
        }
      }, 2000);

      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect Google Calendar",
        variant: "destructive",
      });
    },
  });

  // Disconnect Google Calendar
  const disconnectGoogleCalendar = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch("/api/google-calendar/disconnect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to disconnect");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Calendar Disconnected",
        description: "Google Calendar has been disconnected.",
      });
      refetchCalendarStatus();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disconnect calendar",
        variant: "destructive",
      });
    },
  });

  // Toggle automatic sync
  const toggleSync = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch("/api/google-calendar/toggle-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ enabled }),
      });
      
      if (!response.ok) throw new Error("Failed to toggle sync");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.enabled ? "Sync Enabled" : "Sync Disabled",
        description: data.enabled 
          ? "New schedule slots will automatically sync to Google Calendar."
          : "Automatic syncing has been disabled.",
      });
      refetchCalendarStatus();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle sync",
        variant: "destructive",
      });
    },
  });

  // Sync all slots to Google Calendar
  const syncAllSlots = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch("/api/google-calendar/sync-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to sync slots");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.synced} of ${data.total} slots.`,
      });
      queryClient.invalidateQueries({ queryKey: ["cfi-schedule"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync slots",
        variant: "destructive",
      });
    },
  });

  // Check for calendar connection success from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar_connected") === "true") {
      toast({
        title: "Success",
        description: "Google Calendar connected successfully!",
      });
      refetchCalendarStatus();
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("calendar_error") === "true") {
      toast({
        title: "Error",
        description: "Failed to connect Google Calendar. Please try again.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast, refetchCalendarStatus]);

  // Get week days
  const weekStart = selectedDate ? startOfWeek(selectedDate) : new Date();
  const weekEnd = selectedDate ? endOfWeek(selectedDate) : new Date();
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Group slots by date and CFI
  const slotsByDateAndCFI = scheduleSlots.reduce((acc, slot) => {
    const dateKey = slot.date;
    if (!acc[dateKey]) acc[dateKey] = {};
    
    const cfiKey = slot.cfi_id;
    if (!acc[dateKey][cfiKey]) acc[dateKey][cfiKey] = [];
    
    acc[dateKey][cfiKey].push(slot);
    return acc;
  }, {} as Record<string, Record<string, ScheduleSlot[]>>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">CFI Schedule</h3>
          <p className="text-sm text-muted-foreground">
            View and manage flight instruction availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          {calendarStatus?.connected ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Google Calendar Connected
            </Badge>
          ) : null}
          <Button
            onClick={() => setShowCalendarSettings(true)}
            variant="outline"
            size="sm"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar Settings
          </Button>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Availability
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Week</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Schedule Grid */}
        <Card>
          <CardHeader>
            <CardTitle>
              Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading schedule...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b font-medium">CFI</th>
                      {weekDays.map((day) => (
                        <th key={day.toISOString()} className="text-center p-2 border-b font-medium min-w-[120px]">
                          <div>{format(day, "EEE")}</div>
                          <div className="text-sm font-normal text-muted-foreground">
                            {format(day, "MMM d")}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cfis.map((cfi) => (
                      <tr key={cfi.id}>
                        <td className="p-2 border-b font-medium">
                          {cfi.full_name}
                        </td>
                        {weekDays.map((day) => {
                          const dateKey = format(day, "yyyy-MM-dd");
                          const daySlots = slotsByDateAndCFI[dateKey]?.[cfi.id] || [];
                          
                          return (
                            <td key={day.toISOString()} className="p-2 border-b align-top">
                              <div className="space-y-1">
                                {daySlots.map((slot) => (
                                  <button
                                    key={slot.id}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`
                                      w-full text-left p-2 rounded text-xs transition-colors
                                      ${slot.status === "available" ? "bg-green-100 hover:bg-green-200 text-green-900" : ""}
                                      ${slot.status === "booked" ? "bg-blue-100 hover:bg-blue-200 text-blue-900" : ""}
                                      ${slot.status === "blocked" ? "bg-gray-100 hover:bg-gray-200 text-gray-900" : ""}
                                    `}
                                  >
                                    <div className="font-medium">
                                      {slot.start_time} - {slot.end_time}
                                    </div>
                                    <div className="capitalize">{slot.status}</div>
                                    {slot.status === "booked" && slot.owner && (
                                      <div className="mt-1 truncate">
                                        {slot.owner.full_name}
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Availability Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability</DialogTitle>
            <DialogDescription>
              Add your available time slots for flight instruction.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); createSlot.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <input
                id="date"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <input
                  id="start_time"
                  type="time"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <input
                  id="end_time"
                  type="time"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ScheduleSlot["status"] })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special notes or preferences"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSlot.isPending}>
                {createSlot.isPending ? "Creating..." : "Add Slot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Slot Dialog */}
      {selectedSlot && (
        <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Slot Details</DialogTitle>
              <DialogDescription>
                {format(new Date(selectedSlot.date), "EEEE, MMMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time</p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedSlot.start_time} - {selectedSlot.end_time}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedSlot.status === "available" ? "default" :
                      selectedSlot.status === "booked" ? "secondary" :
                      "outline"
                    }
                  >
                    {selectedSlot.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Instructor</p>
                <p className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedSlot.cfi?.full_name || selectedSlot.cfi?.email}
                </p>
              </div>

              {selectedSlot.status === "booked" && selectedSlot.owner && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Client</p>
                    <p>{selectedSlot.owner.full_name || selectedSlot.owner.email}</p>
                  </div>
                  {selectedSlot.aircraft && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Aircraft</p>
                      <p>{selectedSlot.aircraft.tail_number}</p>
                    </div>
                  )}
                </>
              )}

              {selectedSlot.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedSlot.notes}</p>
                </div>
              )}

              {selectedSlot.cfi_id === user?.id && selectedSlot.status === "available" && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      updateSlotStatus.mutate({ slotId: selectedSlot.id, status: "blocked" });
                      setSelectedSlot(null);
                    }}
                  >
                    Block This Slot
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedSlot(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Google Calendar Settings Dialog */}
      <Dialog open={showCalendarSettings} onOpenChange={setShowCalendarSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Google Calendar Integration</DialogTitle>
            <DialogDescription>
              Sync your instructor availability with Google Calendar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {!calendarStatus?.connected ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Why Connect Google Calendar?</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                    <li>Automatically sync your availability</li>
                    <li>See your schedule across all devices</li>
                    <li>Prevent double-booking</li>
                    <li>Keep everything in one place</li>
                  </ul>
                </div>
                <Button
                  onClick={() => connectGoogleCalendar.mutate()}
                  disabled={connectGoogleCalendar.isPending}
                  className="w-full"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  {connectGoogleCalendar.isPending ? "Connecting..." : "Connect Google Calendar"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Connected</p>
                      <p className="text-sm text-muted-foreground">
                        Your schedule syncs with Google Calendar
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-sync">Automatic Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically sync new slots to Google Calendar
                      </p>
                    </div>
                    <Switch
                      id="auto-sync"
                      checked={calendarStatus?.syncEnabled || false}
                      onCheckedChange={(checked) => toggleSync.mutate(checked)}
                      disabled={toggleSync.isPending}
                    />
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <Button
                      onClick={() => syncAllSlots.mutate()}
                      disabled={syncAllSlots.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncAllSlots.isPending ? 'animate-spin' : ''}`} />
                      {syncAllSlots.isPending ? "Syncing..." : "Sync All Slots Now"}
                    </Button>

                    <Button
                      onClick={() => disconnectGoogleCalendar.mutate()}
                      disabled={disconnectGoogleCalendar.isPending}
                      variant="destructive"
                      className="w-full"
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      {disconnectGoogleCalendar.isPending ? "Disconnecting..." : "Disconnect Calendar"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalendarSettings(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
