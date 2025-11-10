import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, Building2, Plane, Loader2, Star, ChevronRight } from "lucide-react";
import { useClasses, useLocations } from "@/features/pricing/hooks";
import { OnboardingData } from "@/pages/onboarding";
import { cn } from "@/lib/utils";

interface OnboardingPricingStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export function OnboardingPricingStep({ data, updateData, onNext }: OnboardingPricingStepProps) {
  const { data: pricingClasses, isLoading: isLoadingClasses } = useClasses();
  const { data: locations, isLoading: isLoadingLocations } = useLocations();
  
  const [selectedTier, setSelectedTier] = useState(data.membershipTier || "");
  const [selectedHangar, setSelectedHangar] = useState(data.hangarLocation || "none");
  
  // Calculate total price
  const selectedClass = pricingClasses?.find(c => c.slug === selectedTier);
  const selectedLocation = locations?.find(l => l.slug === selectedHangar);
  const hangarCost = selectedHangar === "none" ? 0 : (selectedLocation?.hangar_cost_monthly || 0);
  const totalPrice = (selectedClass?.base_monthly || 0) + hangarCost;
  
  useEffect(() => {
    if (selectedTier && totalPrice > 0) {
      updateData({
        membershipTier: selectedTier,
        hangarLocation: selectedHangar,
        monthlyPrice: totalPrice
      });
    }
  }, [selectedTier, selectedHangar, totalPrice]);
  
  if (isLoadingClasses || isLoadingLocations) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const handleContinue = () => {
    if (selectedTier && totalPrice > 0) {
      onNext();
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Membership Tiers */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Your Membership Tier</h3>
        <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
          <div className="grid gap-4">
            {pricingClasses?.map((tier) => {
              const features = tier.features || {
                "Class I": ["Basic maintenance coordination", "Standard scheduling", "Email support"],
                "Class II": ["Priority maintenance", "Advanced scheduling", "Phone & email support", "Quarterly reviews"],
                "Class III": ["Concierge maintenance", "Anytime scheduling", "24/7 support", "Monthly reviews", "Hangar management"]
              }[tier.name] || [];
              
              return (
                <label
                  key={tier.slug}
                  htmlFor={tier.slug}
                  className={cn(
                    "relative rounded-lg border-2 p-6 cursor-pointer transition-all",
                    selectedTier === tier.slug
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={tier.slug} id={tier.slug} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold">{tier.name}</h4>
                        {tier.name === "Class III" && (
                          <Badge variant="default" className="bg-primary">
                            <Star className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold mb-2">
                        ${tier.base_monthly}/mo
                        <span className="text-sm text-muted-foreground ml-2">base rate</span>
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </RadioGroup>
      </div>
      
      {/* Hangar Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Your Hangar Location</h3>
        <RadioGroup value={selectedHangar} onValueChange={setSelectedHangar}>
          <div className="grid gap-3">
            {/* No Hangar Option */}
            <label
              htmlFor="none"
              className={cn(
                "relative rounded-lg border-2 p-4 cursor-pointer transition-all",
                selectedHangar === "none"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="none" id="none" />
                <Plane className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <h4 className="font-medium">No Hangar</h4>
                  <p className="text-sm text-muted-foreground">I'll arrange my own hangar or tie-down</p>
                </div>
                <span className="font-semibold">+$0/mo</span>
              </div>
            </label>
            
            {/* Location Options */}
            {locations?.map((location) => (
              <label
                key={location.slug}
                htmlFor={location.slug}
                className={cn(
                  "relative rounded-lg border-2 p-4 cursor-pointer transition-all",
                  selectedHangar === location.slug
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={location.slug} id={location.slug} />
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <h4 className="font-medium">{location.name}</h4>
                    {location.description && (
                      <p className="text-sm text-muted-foreground">{location.description}</p>
                    )}
                  </div>
                  <span className="font-semibold">+${location.hangar_cost_monthly}/mo</span>
                </div>
              </label>
            ))}
          </div>
        </RadioGroup>
      </div>
      
      {/* Total Price Summary */}
      {selectedTier && (
        <Card className="bg-primary/5 border-primary">
          <CardHeader>
            <CardTitle>Monthly Total</CardTitle>
            <CardDescription>Your selected membership pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{selectedClass?.name} Membership</span>
                <span>${selectedClass?.base_monthly}/mo</span>
              </div>
              {selectedHangar !== "none" && selectedLocation && (
                <div className="flex justify-between text-sm">
                  <span>{selectedLocation.name} Hangar</span>
                  <span>+${selectedLocation.hangar_cost_monthly}/mo</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totalPrice}/mo</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Continue Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleContinue}
        disabled={!selectedTier || totalPrice === 0}
      >
        Continue to Account Setup
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
