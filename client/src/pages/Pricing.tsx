import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLatestSnapshot, useLocations } from "../features/pricing/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Building2, Plane, AlertCircle } from "lucide-react";
import { Seo } from "@/components/Seo";
import { locationKeywords } from "@/seo/keywords";
import { isFixedPricing } from "@/lib/flags";
import PricingFixed from "@/components/PricingFixed";

export default function Pricing() {
  // If fixed pricing mode is enabled, use the fixed component
  if (isFixedPricing) {
    return <PricingFixed />;
  }
  
  // Otherwise, use configurator-based pricing (requires published snapshot)
  const [, navigate] = useLocation();
  const snapshotQuery = useLatestSnapshot();
  const locationsQuery = useLocations();

  const urlParams = new URLSearchParams(window.location.search);
  const locationParam = urlParams.get('location');
  
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>(locationParam || 'none');

  useEffect(() => {
    if (locationParam) {
      setSelectedLocationSlug(locationParam);
    }
  }, [locationParam]);

  const selectedLocation = locationsQuery.data?.find((loc) => loc.slug === selectedLocationSlug);
  const hangarCost = selectedLocation?.hangar_cost_monthly || 0;

  if (snapshotQuery.isLoading || locationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  const classes = snapshotQuery.data?.payload?.classes || [];
  const locations = locationsQuery.data || [];

  const handleLocationSelect = (slug: string) => {
    setSelectedLocationSlug(slug);
    navigate(`/pricing?location=${slug}`);
  };

  const seoDescription = selectedLocation && selectedLocation.slug !== 'none'
    ? `Transparent aircraft management pricing with ${selectedLocation.name} hangar costs. View complete package pricing for owner-operators at Centennial Airport.`
    : `Transparent aircraft management pricing for owner-operators at Centennial Airport. Choose your hangar location to see complete package costs.`;

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Transparent Pricing - Aircraft Management Packages"
        description={seoDescription}
        keywords={locationKeywords(selectedLocation?.slug)}
        canonical="/pricing"
      />
      
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Choose your service tier and hangar location. All costs included, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Hangar Location Selector */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Step 1: Select Hangar Location</h2>
              <p className="text-muted-foreground">Choose where your aircraft will be housed</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {locations.map((loc) => {
                const isSelected = selectedLocationSlug === loc.slug;
                return (
                  <Card 
                    key={loc.id}
                    className={`cursor-pointer transition-all hover-elevate ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleLocationSelect(loc.slug)}
                    data-testid={`location-card-${loc.slug}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {loc.slug === 'none' ? (
                            <Plane className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Building2 className="h-5 w-5 text-primary" />
                          )}
                          <CardTitle className="text-lg">{loc.name}</CardTitle>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="ml-2">
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm mt-1">
                        {loc.description || 'Standard hangar option'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          ${loc.hangar_cost_monthly}
                        </span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      {loc.features?.amenities && loc.features.amenities.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {loc.features.amenities.slice(0, 2).map((amenity: string, idx: number) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                              <Check className="h-3 w-3 text-primary" />
                              {amenity}
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Service Packages */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-2">Step 2: Choose Your Service Tier</h2>
              <p className="text-muted-foreground">
                {selectedLocation?.slug !== 'none' 
                  ? `Prices shown include ${selectedLocation?.name} hangar costs`
                  : 'Prices shown are base service rates (hangar not included)'}
              </p>
            </div>

            {classes.length === 0 ? (
              <Card className="p-12">
                <p className="text-center text-muted-foreground">
                  No pricing packages available yet. Please check back soon or contact us directly.
                </p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {classes.map((cls: any, index: number) => {
                  const basePrice = cls.base_monthly;
                  const totalPrice = basePrice + hangarCost;
                  const isMiddle = index === 1 && classes.length === 3;

                  return (
                    <Card 
                      key={cls.id} 
                      className={`relative hover-elevate flex flex-col ${isMiddle ? 'ring-2 ring-primary scale-105' : ''}`}
                      data-testid={`pricing-card-${cls.id}`}
                    >
                      {isMiddle && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <Badge variant="default" className="px-4">Most Popular</Badge>
                        </div>
                      )}
                      
                      <CardHeader className="pb-4">
                        <CardTitle className="text-2xl">{cls.name}</CardTitle>
                        <CardDescription className="min-h-[3rem]">
                          {cls.description || 'Premium aircraft management service'}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="flex-1 flex flex-col">
                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">${totalPrice.toLocaleString()}</span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <div>Base service: ${basePrice.toLocaleString()}</div>
                            <div>Hangar: ${hangarCost.toLocaleString()}</div>
                          </div>
                        </div>

                        {cls.features?.benefits && cls.features.benefits.length > 0 && (
                          <div className="flex-1">
                            <div className="text-sm font-medium mb-3">Includes:</div>
                            <ul className="space-y-2">
                              {cls.features.benefits.map((benefit: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  <span className="text-muted-foreground">{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Button 
                          className="w-full mt-6" 
                          variant={isMiddle ? "default" : "outline"}
                          data-testid={`button-select-${cls.id}`}
                        >
                          Get Started
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Disclaimer */}
            <Card className="mt-12 bg-muted/50">
              <CardContent className="p-6">
                <p className="text-sm text-center text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Pricing Notice:</strong> Prices shown are representative packages. 
                  Final pricing may vary based on your specific aircraft requirements, location preferences, and service needs. 
                  All costs are confirmed during onboarding. Contact us for a personalized quote.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
