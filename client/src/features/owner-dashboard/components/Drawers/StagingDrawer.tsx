import { useState } from "react";
import { useForm } from "react-hook-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Coffee, IceCream, Trash2, Fuel, PlaneTakeoff } from "lucide-react";

interface StagingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  aircraftId: string;
  userId: string;
}

export function StagingDrawer({ isOpen, onClose, aircraftId, userId }: StagingDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      fuel_quantity: 50,
      fuel_grade: "100LL",
      hangar_pullout: true,
      requested_departure: "",
      cabin_provisioning: {
        ice: false,
        coffee: false,
        trash_removal: true,
      }
    }
  });

  const fuelQuantity = watch("fuel_quantity");
  const cabinProvisioning = watch("cabin_provisioning");

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("service_requests").insert({
        aircraft_id: aircraftId,
        user_id: userId,
        service_type: "staging",
        priority: "medium",
        requested_departure: data.requested_departure ? new Date(data.requested_departure).toISOString() : null,
        fuel_quantity: data.fuel_quantity,
        fuel_grade: data.fuel_grade,
        hangar_pullout: data.hangar_pullout,
        cabin_provisioning: data.cabin_provisioning,
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "Staging Request Submitted",
        description: "The flight line team has been notified.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["ops-feed"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
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
            <PlaneTakeoff className="h-6 w-6 text-indigo-500" />
            Request Staging
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Prepare your aircraft for departure.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Departure Time */}
          <div className="space-y-3">
            <Label htmlFor="requested_departure" className="text-xs uppercase tracking-widest text-slate-500 font-bold">
              Requested Departure
            </Label>
            <Input
              id="requested_departure"
              type="datetime-local"
              className="bg-slate-900 border-slate-800 focus:ring-indigo-500"
              required
              {...register("requested_departure")}
            />
          </div>

          {/* Fuel Section */}
          <div className="space-y-6 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-indigo-400" />
                  Fuel Quantity (Gallons)
                </Label>
                <span className="text-lg font-mono font-bold text-indigo-400">{fuelQuantity}</span>
              </div>
              <Slider
                defaultValue={[50]}
                max={100}
                step={1}
                onValueChange={(vals) => setValue("fuel_quantity", vals[0])}
                className="py-4"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Fuel Grade</Label>
              <Select onValueChange={(val) => setValue("fuel_grade", val)} defaultValue="100LL">
                <SelectTrigger className="bg-slate-950 border-slate-800">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800">
                  <SelectItem value="100LL">100LL (Blue)</SelectItem>
                  <SelectItem value="Jet-A">Jet-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hangar Pullout */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-slate-200">Hangar Pullout</Label>
              <p className="text-xs text-slate-500">Move aircraft to the flight line</p>
            </div>
            <Switch
              checked={watch("hangar_pullout")}
              onCheckedChange={(val) => setValue("hangar_pullout", val)}
              className="data-[state=checked]:bg-indigo-500"
            />
          </div>

          {/* Cabin Provisioning */}
          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Cabin Provisioning</Label>
            <div className="grid gap-3">
              {[
                { id: "ice", label: "Fresh Ice", icon: IceCream },
                { id: "coffee", label: "Hot Coffee", icon: Coffee },
                { id: "trash_removal", label: "Trash Removal", icon: Trash2 },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{item.label}</span>
                  </div>
                  <Switch
                    checked={(cabinProvisioning as any)[item.id]}
                    onCheckedChange={(val) => 
                      setValue("cabin_provisioning", { ...cabinProvisioning, [item.id]: val })
                    }
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <SheetFooter className="pt-8">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Confirm Staging Request"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
