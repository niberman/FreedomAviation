import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MembershipSelection, AircraftInfo } from "@/types/onboarding";
import { 
  PRICING_TIERS, 
  HOURS_BANDS, 
  CORE_FEATURES,
  calculateMonthlyPrice,
  recommendTierByAircraft,
  recommendHoursBand,
  type PricingTier,
  type HoursRange,
} from "@/lib/unified-pricing";
import { Loader2, Check, Bell } from "lucide-react";

interface MembershipStepProps {
  initialData?: MembershipSelection;
  aircraftInfo?: AircraftInfo;
  onComplete: (data: MembershipSelection) => void;
  onBack: () => void;
  saving: boolean;
}

export function MembershipStep({ initialData, aircraftInfo, onComplete, onBack, saving }: MembershipStepProps) {
  // Convert old format to new format if needed
  const getInitialTier = (): PricingTier => {
    if (initialData?.package_id === 'class-i') return 'light';
    if (initialData?.package_id === 'class-iii') return 'turbine';
    return 'performance';
  };

  const [selectedTier, setSelectedTier] = useState<PricingTier>(getInitialTier());
  const [selectedHoursBand, setSelectedHoursBand] = useState<HoursRange>(
    initialData?.hours_band || '20-50'
  );

  // Get hangar info from URL params or localStorage
  const [hangarId, setHangarId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('hangar') || localStorage.getItem('fa:hangar') || 'none';
  });

  const [hangarCost, setHangarCost] = useState<number>(initialData?.hangar_cost || 0);

  useEffect(() => {
    if (hangarId === 'none') {
      setHangarCost(0);
    }
  }, [hangarId]);

  const selectedTierData = PRICING_TIERS.find(t => t.id === selectedTier)!;
  const selectedHoursBandData = HOURS_BANDS.find(h => h.range === selectedHoursBand)!;
  
  const baseMonthlyPrice = calculateMonthlyPrice(selectedTier, selectedHoursBand);

  const handleSubmit = () => {
    onComplete({
      package_id: selectedTier, // Now uses new format
      hours_band: selectedHoursBand,
      hangar_id: hangarId,
      hangar_cost: hangarCost,
      base_monthly: baseMonthlyPrice,
    });
  };

  // Get recommended tier based on aircraft info
  const recommendedTier = aircraftInfo 
    ? recommendTierByAircraft(aircraftInfo.model)
    : 'performance';

  const recommendedHoursBandValue = recommendHoursBand(aircraftInfo?.average_monthly_hours);

  const monthlyPrice = baseMonthlyPrice;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <Bell className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Choose Your Membership</h2>
        <p className="text-muted-foreground">
          Select the service tier that matches your aircraft and flying habits.
        </p>
      </div>

      {/* Recommended Package Alert */}
      {aircraftInfo && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Recommended for your {aircraftInfo.make} {aircraftInfo.model}</p>
                <p className="text-sm text-muted-foreground">
                  {PRICING_TIERS.find(t => t.id === recommendedTier)?.title} with {recommendedHoursBandValue} hours/month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Package Selection */}
      <div className="space-y-4">
        <h3 className="font-semibold">Select Service Tier</h3>
        <div className="grid gap-4">
          {PRICING_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id;
            const isRecommended = tier.id === recommendedTier;

            return (
              <Card
                key={tier.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTier(tier.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tier.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {tier.examples.join(', ')}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {isRecommended && (
                        <Badge variant="secondary">Recommended</Badge>
                      )}
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Starting at ${tier.baseMonthly}/month
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Hours Band Selection */}
      <div className="space-y-4">
        <h3 className="font-semibold">Select Monthly Flying Hours</h3>
        <div className="grid gap-3">
          {HOURS_BANDS.map((band) => {
            const isSelected = selectedHoursBand === band.range;
            const isRecommended = band.range === recommendedHoursBandValue;
            const price = calculateMonthlyPrice(selectedTier, band.range);

            return (
              <Card
                key={band.range}
                className={`cursor-pointer transition-all hover:shadow-sm ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedHoursBand(band.range)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <div className="font-medium">{band.range} hours/month</div>
                        <div className="text-sm text-muted-foreground">
                          {band.detailsPerMonth} detail{band.detailsPerMonth !== '1' ? 's' : ''} • {band.serviceFrequency}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${price}</div>
                      <div className="text-xs text-muted-foreground">per month</div>
                      {isRecommended && (
                        <Badge variant="secondary" className="mt-1">Recommended</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Monthly Total</p>
              <p className="text-sm text-muted-foreground">
                {selectedTierData.title} • {selectedHoursBand} hours
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${monthlyPrice}</p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Includes Section */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">What's Included:</h4>
        <div className="grid gap-2">
          {CORE_FEATURES.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{feature.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={saving} className="flex-1">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Continue to Quote'
          )}
        </Button>
      </div>
    </div>
  );
}

