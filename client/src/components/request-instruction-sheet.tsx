import { useState } from "react";
import { Calendar, Clock, Plane, User } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface RequestInstructionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraft: {
    id?: string;
    tailNumber: string;
    make: string;
    model: string;
  };
}

const instructionTypes = [
  { value: "flight_instruction", label: "Flight Instruction" },
  { value: "instrument_training", label: "Instrument Training" },
  { value: "commercial_training", label: "Commercial Training" },
  { value: "cfi_training", label: "CFI Training" },
  { value: "biennial_review", label: "Biennial Flight Review" },
  { value: "instrument_proficiency", label: "Instrument Proficiency Check" },
  { value: "checkout", label: "Aircraft Checkout" },
  { value: "ground_instruction", label: "Ground Instruction" },
];

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

export function RequestInstructionSheet({ open, onOpenChange, aircraft }: RequestInstructionSheetProps) {
  const [instructionType, setInstructionType] = useState("flight_instruction");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [duration, setDuration] = useState("1.0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit an instruction request.",
        variant: "destructive",
      });
      return;
    }

    if (!date || !time || !aircraft.id) {
      toast({
        title: "Missing information",
        description: "Please select a date and time for your instruction.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("instruction_requests")
        .insert({
          student_id: user.id,
          aircraft_id: aircraft.id,
          requested_date: format(date, "yyyy-MM-dd"),
          requested_time: time,
          instruction_type: instructionType,
          duration_hours: parseFloat(duration),
          notes: notes || null,
          status: "pending"
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Flight instruction request submitted successfully!",
      });

      // Reset form
      setInstructionType("flight_instruction");
      setDate(undefined);
      setTime(undefined);
      setDuration("1.0");
      setNotes("");
      
      onOpenChange(false);
      
      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ["instruction-requests"] });
    } catch (error: any) {
      console.error("Error submitting instruction request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit instruction request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Request Flight Instruction</SheetTitle>
          <SheetDescription>
            Schedule flight instruction for {aircraft.tailNumber}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Aircraft Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Plane className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">{aircraft.tailNumber}</p>
              <p className="text-sm text-muted-foreground">
                {aircraft.make} {aircraft.model}
              </p>
            </div>
          </div>

          {/* Instruction Type */}
          <div className="space-y-2">
            <Label htmlFor="instruction-type">Instruction Type</Label>
            <Select value={instructionType} onValueChange={setInstructionType}>
              <SelectTrigger id="instruction-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {instructionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Preferred Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time">Preferred Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger id="time">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.0">1.0 hour</SelectItem>
                <SelectItem value="1.5">1.5 hours</SelectItem>
                <SelectItem value="2.0">2.0 hours</SelectItem>
                <SelectItem value="2.5">2.5 hours</SelectItem>
                <SelectItem value="3.0">3.0 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific areas you'd like to focus on, or other information for the instructor..."
              className="min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading || !date || !time}
            >
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
