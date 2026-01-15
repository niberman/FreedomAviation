import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, User, Calendar } from "lucide-react";

interface InstructionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  aircraftId: string;
  userId: string;
}

export function InstructionDrawer({ isOpen, onClose, aircraftId, userId }: InstructionDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      instruction_type: "Flight Instruction",
      cfi_id: "",
      requested_date: "",
      notes: "",
    }
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ["instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name")
        .eq("role", "cfi");
      if (error) throw error;
      return data;
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("instruction_requests").insert({
        aircraft_id: aircraftId,
        student_id: userId,
        cfi_id: data.cfi_id || null,
        instruction_type: data.instruction_type,
        requested_date: data.requested_date,
        notes: data.notes,
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "Instruction Requested",
        description: "Your training session has been requested.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["ops-feed"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to book instructor",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md bg-slate-950 border-slate-800 text-slate-100 overflow-y-auto">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-indigo-500" />
            Book Instructor
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Schedule a session with one of our professional CFIs.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Type of Instruction */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Instruction Type</Label>
            <Select onValueChange={(val) => setValue("instruction_type", val)} defaultValue="Flight Instruction">
              <SelectTrigger className="bg-slate-900 border-slate-800">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800">
                <SelectItem value="Flight Instruction">Flight Instruction</SelectItem>
                <SelectItem value="Ground School">Ground School</SelectItem>
                <SelectItem value="Instrument Proficiency">Instrument Proficiency (IPC)</SelectItem>
                <SelectItem value="Biannual Review">Biannual Review (BFR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instructor Selection */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Select Instructor (Optional)
            </Label>
            <Select onValueChange={(val) => setValue("cfi_id", val)}>
              <SelectTrigger className="bg-slate-900 border-slate-800">
                <SelectValue placeholder="No preference" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800">
                <SelectItem value="none">No preference</SelectItem>
                {instructors.map((cfi) => (
                  <SelectItem key={cfi.id} value={cfi.id}>
                    {cfi.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requested Date */}
          <div className="space-y-3">
            <Label htmlFor="requested_date" className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Requested Date
            </Label>
            <Input
              id="requested_date"
              type="date"
              className="bg-slate-900 border-slate-800 focus:ring-indigo-500"
              required
              {...register("requested_date")}
            />
          </div>

          <SheetFooter className="pt-8">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Submit Booking Request"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
