import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MembershipSelection, AircraftInfo } from "@/types/onboarding";
import { PACKAGES, HoursBand } from "@/lib/pricing-packages";
import { Loader2, Check, Bell } from "lucide-react";

interface MembershipStepProps {
  initialData?: MembershipSelection;
  aircraftInfo?: AircraftInfo;
  onComplete: (data: MembershipSelection) => void;
  onBack: () => void;
  saving: boolean;
}

export function MembershipStep({ initialData, aircraftInfo, onComplete, onBack, saving }: MembershipStepProps) {
  const [selectedPackage, setSelectedPackage] = useState<'class-i' | 'class-ii' | 'class-iii'>(
    (initialData?.package_id as any) || 'class-ii'
  );
  const [selectedHoursBand, setSelectedHoursBand] = useState<'0-20' | '20-50' | '50+'>(
    initialData?.hours_band || '20-50'
  );

  // Get hangar info from URL params or localStorage (passed from pricing page)
  const [hangarId, setHangarId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('hangar') || localStorage.getItem('fa:hangar') || 'none';
  });

  const [hangarCost, setHangarCost] = useState<number>(initialData?.hangar_cost || 0);

  useEffect(() => {
    // You could fetch hangar cost from database here if needed
    // For now, we'll just use 0 for 'none' or get from localStorage
    if (hangarId === 'none') {
      setHangarCost(0);
    }
  }, [hangarId]);

  const selectedPackageData = PACKAGES.find(p => p.id === selectedPackage);
  const selectedHoursBandData = selectedPackageData?.hours.find(h => h.range === selectedHoursBand);
  
  const baseMonthlyPrice = selectedPackageData && selectedHoursBandData
    ? Math.round(selectedPackageData.baseMonthly * selectedHoursBandData.priceMultiplier)
    : 0;

  const handleSubmit = () => {
    onComplete({
      package_id: selectedPackage,
      hours_band: selectedHoursBand,
      hangar_id: hangarId,
      hangar_cost: hangarCost,
      base_monthly: baseMonthlyPrice,
    });
  };

  // Get recommended package based on aircraft info
  const getRecommendedPackage = (): 'class-i' | 'class-ii' | 'class-iii' => {
    if (!aircraftInfo) return 'class-ii';
    
    const model = aircraftInfo.model.toLowerCase();
    
    // Class III - Turbine
    if (model.includes('vision') || model.includes('tbm') || model.includes('jet')) {
      return 'class-iii';
    }
    
    // Class II - High-performance
    if (model.includes('sr') || model.includes('cirrus') || model.includes('da40') || model.includes('mooney')) {
      return 'class-ii';
    }
    
    // Class I - Basic piston
    return 'class-i';
  };

  // Get recommended hours band based on average monthly hours
  const getRecommendedHoursBand = (): '0-20' | '20-50' | '50+' => {
    const avgHours = aircraftInfo?.average_monthly_hours || 25;
    
    if (avgHours >= 50) return '50+';
    if (avgHours >= 20) return '20-50';
    return '0-20';
  };

  const recommendedPackage = getRecommendedPackage();
  const recommendedHoursBand = getRecommendedHoursBand();

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
                  {PACKAGES.find(p => p.id === recommendedPackage)?.title} with {recommendedHoursBand} hours/month
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
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPackage === pkg.id;
            const isRecommended = pkg.id === recommendedPackage;

            return (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{pkg.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {pkg.examples.join(', ')}
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
                    Starting at ${pkg.baseMonthly}/month
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
          {selectedPackageData?.hours.map((band: HoursBand) => {
            const isSelected = selectedHoursBand === band.range;
            const isRecommended = band.range === recommendedHoursBand;
            const price = Math.round(selectedPackageData.baseMonthly * band.priceMultiplier);

            return (
              <Card
                key={band.range}
                className={`cursor-pointer transition-all hover:shadow-sm ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedHoursBand(band.range as any)}
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
                {selectedPackageData?.title} • {selectedHoursBand} hours
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
      {selectedPackageData && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">What's Included:</h4>
          <div className="grid gap-2">
            {selectedPackageData.includes.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

