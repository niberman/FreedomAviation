import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Check, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

import { 
  AIRCRAFT_PROFILES, 
  AIRCRAFT_LIST, 
  type AircraftFeatures, 
  type SizeClass 
} from '@/lib/pricing/aircraftConfig';
import { 
  calculatePricing, 
  formatCurrency, 
  roundToNearestPricingIncrement 
} from '@/lib/pricing/pricingEngine';
import { 
  selectTier, 
  getHangarFootprintLabel,
  getSizeClassLabel 
} from '@/lib/pricing/tiersConfig';

interface PricingConfiguratorProps {
  className?: string;
}

// UI content configuration
const UI_CONFIG = {
  hoursLabels: {
    0: 'Light use',
    20: 'Typical',
    40: 'Heavy use',
  },
  customFeatureLabels: {
    hasTurbo: 'Turbocharged',
    hasTKS: 'TKS Ice Protection',
    hasOxygen: 'Oxygen System',
    hasPressurization: 'Pressurized',
  },
  sizeClassOptions: [
    { value: 'small_piston' as SizeClass, label: 'Light Piston' },
    { value: 'hp_piston' as SizeClass, label: 'High Performance' },
    { value: 'turboprop' as SizeClass, label: 'Turboprop' },
    { value: 'light_jet' as SizeClass, label: 'Light Jet' },
  ],
} as const;

export function PricingConfigurator({ className }: PricingConfiguratorProps) {
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>('sr22t-fiki');
  const [monthlyHours, setMonthlyHours] = useState<number>(20);
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  // Custom aircraft state
  const [customFeatures, setCustomFeatures] = useState<Partial<AircraftFeatures>>({
    sizeClass: 'hp_piston',
    hasTurbo: false,
    hasTKS: false,
    hasOxygen: false,
    hasPressurization: false,
  });

  // Get current aircraft features
  const aircraftFeatures = useMemo(() => {
    if (isCustomMode) {
      // Merge custom features with base custom profile
      const baseCustom = AIRCRAFT_PROFILES.custom;
      const features: AircraftFeatures = {
        ...baseCustom,
        ...customFeatures,
        // Update consumables based on features
        consumablesProfile: {
          tksPerHour: customFeatures.hasTKS ? 1.5 : 0,
          oxygenPerHour: customFeatures.hasOxygen ? 1.0 : 0,
          oilPerHour: 0.8,
        },
        // Update complexity based on features
        cleaningComplexity: customFeatures.sizeClass === 'light_jet' ? 5 :
                           customFeatures.sizeClass === 'turboprop' ? 4 : 3,
        systemsComplexity: (customFeatures.hasTKS || customFeatures.hasOxygen) ? 4 : 3,
        // Update hangar footprint
        hangarFootprintClass: customFeatures.sizeClass === 'light_jet' ? 'jet_light' :
                             customFeatures.sizeClass === 'turboprop' ? 'turboprop' :
                             customFeatures.sizeClass === 'hp_piston' ? 'piston_hp' : 'piston_single',
      };
      return features;
    }
    return AIRCRAFT_PROFILES[selectedAircraftId];
  }, [selectedAircraftId, isCustomMode, customFeatures]);

  // Calculate pricing
  const pricing = useMemo(() => {
    return calculatePricing({
      aircraftFeatures,
      monthlyHours,
    });
  }, [aircraftFeatures, monthlyHours]);

  // Select tier
  const tier = useMemo(() => {
    return selectTier(aircraftFeatures, monthlyHours, pricing);
  }, [aircraftFeatures, monthlyHours, pricing]);

  // Group aircraft by category for display
  const aircraftByCategory = useMemo(() => {
    const grouped = AIRCRAFT_LIST.reduce((acc, aircraft) => {
      const category = getSizeClassLabel(aircraft.category);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(aircraft);
      return acc;
    }, {} as Record<string, typeof AIRCRAFT_LIST>);
    return grouped;
  }, []);

  return (
    <div className={cn("w-full max-w-7xl mx-auto grid gap-8 lg:grid-cols-2", className)}>
      {/* Left Column - Configuration */}
      <div className="space-y-8">
        {/* Aircraft Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Your Aircraft</CardTitle>
            <CardDescription>
              Choose from common models or create a custom profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Aircraft Grid */}
            <div className="space-y-4">
              {Object.entries(aircraftByCategory).map(([category, aircraft]) => (
                <div key={category} className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{category}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {aircraft.map((ac) => (
                      <Button
                        key={ac.id}
                        variant={selectedAircraftId === ac.id && !isCustomMode ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start"
                        onClick={() => {
                          setSelectedAircraftId(ac.id);
                          setIsCustomMode(false);
                        }}
                      >
                        <Plane className="mr-2 h-3 w-3" />
                        {ac.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Custom Aircraft Button */}
              <Button
                variant={isCustomMode ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setIsCustomMode(true)}
              >
                Custom Aircraft Profile
              </Button>
            </div>

            {/* Custom Aircraft Options */}
            {isCustomMode && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Aircraft Size Class</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {UI_CONFIG.sizeClassOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={customFeatures.sizeClass === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCustomFeatures({ ...customFeatures, sizeClass: option.value })}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(UI_CONFIG.customFeatureLabels).map(([feature, label]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <Label htmlFor={feature} className="text-sm">
                        {label}
                      </Label>
                      <Switch
                        id={feature}
                        checked={customFeatures[feature as keyof typeof customFeatures] as boolean}
                        onCheckedChange={(checked) => 
                          setCustomFeatures({ ...customFeatures, [feature]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hours Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Flight Hours</CardTitle>
            <CardDescription>
              Estimate your typical monthly usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Hours per month</Label>
                <span className="text-2xl font-semibold">{monthlyHours}</span>
              </div>
              <Slider
                value={[monthlyHours]}
                onValueChange={([value]) => setMonthlyHours(value)}
                min={0}
                max={40}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                {Object.entries(UI_CONFIG.hoursLabels).map(([value, label]) => (
                  <span key={value}>{label}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Results */}
      <div className="space-y-6">
        {/* Tier Result */}
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{tier.tierDisplayName}</CardTitle>
                <CardDescription>{tier.subtitle}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  ~{formatCurrency(roundToNearestPricingIncrement(pricing.totalMonthly))}
                </p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">Included Services</p>
              {tier.bulletPoints.map((bullet, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{bullet}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>
              Transparent pricing based on your aircraft and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Hangar at Centennial</p>
                  <p className="text-sm text-muted-foreground">
                    {getHangarFootprintLabel(aircraftFeatures.hangarFootprintClass)}
                  </p>
                </div>
                <span className="font-semibold">{formatCurrency(pricing.hangarFee)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Membership Base</p>
                  <p className="text-sm text-muted-foreground">
                    Tracking, coordination, basic care
                  </p>
                </div>
                <span className="font-semibold">{formatCurrency(pricing.baseMembershipFee)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Operations Coverage</p>
                  <p className="text-sm text-muted-foreground">
                    {monthlyHours} hours × {formatCurrency(pricing.opsRatePerHour)}/hr
                  </p>
                  {pricing.hourlyConsumablesRate > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Includes {formatCurrency(pricing.hourlyConsumablesRate)}/hr for consumables
                    </p>
                  )}
                </div>
                <span className="font-semibold">{formatCurrency(pricing.opsTotal)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <p className="text-lg font-semibold">Total Monthly</p>
                <span className="text-lg font-bold">
                  {formatCurrency(pricing.totalMonthly)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <h3 className="text-xl font-semibold">Ready to elevate your ownership experience?</h3>
              <p className="text-sm opacity-90">
                Schedule a consultation to discuss your specific needs and tour our facilities
              </p>
              <Button 
                variant="secondary" 
                size="lg"
                className="w-full"
              >
                Schedule Consultation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
