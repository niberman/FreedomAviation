import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Info, Plane } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding";

interface OnboardingAircraftStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const AIRCRAFT_CLASSES = [
  { value: "standard", label: "Standard" },
  { value: "complex", label: "Complex" },
  { value: "high_performance", label: "High Performance" },
  { value: "turboprop", label: "Turboprop" },
  { value: "jet", label: "Jet" },
];

const COMMON_AIRPORTS = [
  { value: "KAPA", label: "KAPA - Centennial Airport" },
  { value: "KBJC", label: "KBJC - Rocky Mountain Metropolitan Airport" },
  { value: "KDEN", label: "KDEN - Denver International Airport" },
  { value: "KCOS", label: "KCOS - Colorado Springs Airport" },
  { value: "KFNL", label: "KFNL - Fort Collins-Loveland Airport" },
  { value: "KEGE", label: "KEGE - Eagle County Regional Airport" },
  { value: "other", label: "Other" },
];

export function OnboardingAircraftStep({ data, updateData, onNext }: OnboardingAircraftStepProps) {
  const { toast } = useToast();
  
  const [tailNumber, setTailNumber] = useState(data.tailNumber || "");
  const [make, setMake] = useState(data.aircraftMake || "");
  const [model, setModel] = useState(data.aircraftModel || "");
  const [year, setYear] = useState(data.aircraftYear?.toString() || "");
  const [aircraftClass, setAircraftClass] = useState(data.aircraftClass || "");
  const [baseAirport, setBaseAirport] = useState(data.baseAirport || "KAPA");
  const [customAirport, setCustomAirport] = useState("");
  const [averageHours, setAverageHours] = useState(data.averageMonthlyHours || 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const validateForm = () => {
    if (!tailNumber || !make || !model) {
      setError("Please fill in all required fields");
      return false;
    }
    
    // Validate tail number format (basic US format)
    const tailNumberRegex = /^N[0-9]{1,5}[A-Z]{0,2}$/i;
    if (!tailNumberRegex.test(tailNumber.toUpperCase())) {
      setError("Please enter a valid US tail number (e.g., N12345 or N123AB)");
      return false;
    }
    
    if (year && (parseInt(year) < 1940 || parseInt(year) > new Date().getFullYear() + 1)) {
      setError("Please enter a valid year");
      return false;
    }
    
    return true;
  };
  
  const handleSaveAndContinue = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Format tail number
      const formattedTailNumber = tailNumber.toUpperCase();
      
      // Determine final base airport
      const finalBaseAirport = baseAirport === "other" ? customAirport : baseAirport;
      
      // Create aircraft record
      const { data: aircraft, error: aircraftError } = await supabase
        .from("aircraft")
        .insert({
          tail_number: formattedTailNumber,
          make: make.trim(),
          model: model.trim(),
          year: year ? parseInt(year) : null,
          class: aircraftClass || null,
          owner_id: user.id,
          base_location: finalBaseAirport || "KAPA",
        })
        .select()
        .single();
      
      if (aircraftError) {
        if (aircraftError.message?.includes("duplicate")) {
          throw new Error("This tail number is already registered");
        }
        throw aircraftError;
      }
      
      // Create membership record based on selected tier
      if (data.membershipTier) {
        const { error: membershipError } = await supabase
          .from("memberships")
          .insert({
            owner_id: user.id,
            aircraft_id: aircraft.id,
            tier: data.membershipTier === "class-i" ? "I" : 
                 data.membershipTier === "class-ii" ? "II" : 
                 data.membershipTier === "class-iii" ? "III" : "I",
            is_active: false, // Will be activated after payment
            start_date: new Date().toISOString(),
          });
        
        if (membershipError) {
          console.error("Failed to create membership:", membershipError);
          // Don't fail the whole process if membership creation fails
        }
      }
      
      // Update user profile with average flight hours
      await supabase
        .from("user_profiles")
        .update({
          average_monthly_flight_hours: averageHours,
        })
        .eq("id", user.id);
      
      // Update onboarding data
      updateData({
        tailNumber: formattedTailNumber,
        aircraftMake: make.trim(),
        aircraftModel: model.trim(),
        aircraftYear: year ? parseInt(year) : undefined,
        aircraftClass,
        baseAirport: finalBaseAirport || "KAPA",
        averageMonthlyHours: averageHours,
      });
      
      toast({
        title: "Aircraft registered!",
        description: `${formattedTailNumber} has been added to your account.`,
      });
      
      // Proceed to payment
      onNext();
    } catch (err: any) {
      console.error("Aircraft registration error:", err);
      setError(err.message || "Failed to register aircraft. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const formatTailNumber = (value: string) => {
    // Format to uppercase and limit length
    return value.toUpperCase().slice(0, 7);
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Tell us about your aircraft so we can provide the best service for your needs.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-4">
        {/* Tail Number */}
        <div className="space-y-2">
          <Label htmlFor="tailNumber">Tail Number *</Label>
          <Input
            id="tailNumber"
            type="text"
            placeholder="N12345"
            value={tailNumber}
            onChange={(e) => setTailNumber(formatTailNumber(e.target.value))}
            disabled={loading}
            maxLength={7}
          />
          <p className="text-sm text-muted-foreground">
            US tail numbers only (e.g., N12345)
          </p>
        </div>
        
        {/* Make and Model */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              type="text"
              placeholder="Cessna"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              type="text"
              placeholder="172SP"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        
        {/* Year and Class */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              placeholder="2020"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={loading}
              min="1940"
              max={new Date().getFullYear() + 1}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="class">Aircraft Class</Label>
            <Select value={aircraftClass} onValueChange={setAircraftClass} disabled={loading}>
              <SelectTrigger id="class">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {AIRCRAFT_CLASSES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Base Airport */}
        <div className="space-y-2">
          <Label htmlFor="baseAirport">Base Airport</Label>
          <Select value={baseAirport} onValueChange={setBaseAirport} disabled={loading}>
            <SelectTrigger id="baseAirport">
              <SelectValue placeholder="Select airport" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_AIRPORTS.map(airport => (
                <SelectItem key={airport.value} value={airport.value}>
                  {airport.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {baseAirport === "other" && (
            <Input
              className="mt-2"
              type="text"
              placeholder="Enter airport code"
              value={customAirport}
              onChange={(e) => setCustomAirport(e.target.value.toUpperCase())}
              disabled={loading}
              maxLength={4}
            />
          )}
        </div>
        
        {/* Average Monthly Flight Hours */}
        <div className="space-y-2">
          <Label htmlFor="hours">Average Monthly Flight Hours</Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{averageHours} hours</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Plane className="w-4 h-4" />
                <span>per month</span>
              </div>
            </div>
            <Slider
              id="hours"
              value={[averageHours]}
              onValueChange={(values) => setAverageHours(values[0])}
              max={50}
              min={0}
              step={1}
              disabled={loading}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40</span>
              <span>50+</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This helps us understand your maintenance needs
          </p>
        </div>
      </div>
      
      {/* Submit Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleSaveAndContinue}
        disabled={loading || !tailNumber || !make || !model}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Registering Aircraft...
          </>
        ) : (
          "Save Aircraft & Continue to Payment"
        )}
      </Button>
    </div>
  );
}
