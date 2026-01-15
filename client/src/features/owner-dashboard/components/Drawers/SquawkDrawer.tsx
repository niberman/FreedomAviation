import { useState } from "react";
import { useForm } from "react-hook-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SquawkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  aircraftId: string;
  userId: string;
}

export function SquawkDrawer({ isOpen, onClose, aircraftId, userId }: SquawkDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      priority: "medium",
      description: "",
    }
  });

  const priority = watch("priority");

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("service_requests").insert({
        aircraft_id: aircraftId,
        user_id: userId,
        service_type: "squawk",
        priority: data.priority,
        description: data.description,
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "Squawk Reported",
        description: "The maintenance team has been notified.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["ops-feed"] });
      queryClient.invalidateQueries({ queryKey: ["aircraft-operational-status"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to report issue",
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
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Report Squawk
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Log an issue for the maintenance team.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Priority / Grounded Status */}
          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Severity / Priority</Label>
            <RadioGroup
              defaultValue="medium"
              onValueChange={(val) => setValue("priority", val)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="high" id="priority-high" className="peer sr-only" />
                <Label
                  htmlFor="priority-high"
                  className={cn(
                    "flex flex-col items-center justify-between rounded-xl border-2 border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-900 hover:text-slate-100 peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-500/10 transition-all cursor-pointer",
                    priority === 'high' && "border-red-500 bg-red-500/10"
                  )}
                >
                  <AlertCircle className="mb-3 h-6 w-6 text-red-500" />
                  <span className="text-sm font-bold">Grounded</span>
                  <span className="text-[10px] text-slate-500 mt-1">AOG - High Priority</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="medium" id="priority-medium" className="peer sr-only" />
                <Label
                  htmlFor="priority-medium"
                  className={cn(
                    "flex flex-col items-center justify-between rounded-xl border-2 border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-900 hover:text-slate-100 peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-500/10 transition-all cursor-pointer",
                    priority === 'medium' && "border-amber-500 bg-amber-500/10"
                  )}
                >
                  <Info className="mb-3 h-6 w-6 text-amber-500" />
                  <span className="text-sm font-bold">Flyable</span>
                  <span className="text-[10px] text-slate-500 mt-1">Informational/Repair</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-xs uppercase tracking-widest text-slate-500 font-bold">
              Issue Description
            </Label>
            <Textarea
              id="description"
              placeholder="Provide details about the issue (e.g., 'Right landing light out', 'Vibration in climb')..."
              className="min-h-[150px] bg-slate-900 border-slate-800 focus:ring-amber-500"
              required
              {...register("description")}
            />
          </div>

          <SheetFooter className="pt-8">
            <Button 
              type="submit" 
              className={cn(
                "w-full font-bold h-12",
                priority === 'high' ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Squawk"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
