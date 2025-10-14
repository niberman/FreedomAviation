import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLatestSnapshot, useLocations } from "../features/pricing/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, MapPinned } from "lucide-react";
import { Seo } from "@/components/Seo";
import { locationKeywords } from "@/seo/keywords";

export default function Pricing() {
  const [, navigate] = useLocation();
  const snapshotQuery = useLatestSnapshot();
  const locationsQuery = useLocations();

  // Get location from query param
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

  const handleLocationChange = (slug: string) => {
    setSelectedLocationSlug(slug);
    navigate(`/pricing?location=${slug}`);
  };

  const seoDescription = selectedLocation && selectedLocation.slug !== 'none'
    ? `Transparent aircraft management pricing with ${selectedLocation.name} hangar costs. View complete package pricing for owner-operators at Centennial Airport.`
    : `Transparent aircraft management pricing for owner-operators at Centennial Airport. Choose your hangar location to see complete package costs.`;

  return (
    <div className="min-h-screen">
      <Seo
        title="Transparent Pricing - Aircraft Management Packages"
        description={seoDescription}
        keywords={locationKeywords(selectedLocation?.slug)}
        canonical="/pricing"
      />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Transparent Pricing</h1>
            <p className="text-xl text-primary-foreground/90">
              Choose your hangar location to see complete pricing with all costs included
            </p>
          </div>
        </div>
      </section>

      {/* Location Selector */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <Label className="font-medium">Hangar Location:</Label>
              </div>
              <Select value={selectedLocationSlug} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-full md:w-80" data-testid="select-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.slug} data-testid={`location-option-${loc.slug}`}>
                      {loc.name}
                      {loc.hangar_cost_monthly ? ` ($${loc.hangar_cost_monthly}/mo)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLocation && selectedLocation.slug !== 'none' && (
                <Badge variant="secondary" className="ml-auto">
                  Hangar: ${hangarCost}/mo
                </Badge>
              )}
            </div>

            {selectedLocation && selectedLocation.slug !== 'none' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <MapPinned className="h-4 w-4" />
                  <span>You're viewing prices with <strong>{selectedLocation.name}</strong> hangar costs applied.</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {classes.length === 0 ? (
              <p className="text-center text-muted-foreground">No pricing data available. Contact admin to publish pricing.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls: any) => {
                  const basePrice = cls.base_monthly;
                  const estimatedTotal = basePrice + hangarCost;

                  return (
                    <Card key={cls.id} className="relative hover-elevate" data-testid={`pricing-card-${cls.id}`}>
                      <CardHeader>
                        <CardTitle>{cls.name}</CardTitle>
                        <CardDescription>
                          {cls.description || 'Premium aircraft management service'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-muted-foreground">Base Service</span>
                          <span className="font-medium">${basePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-muted-foreground">+ Hangar ({selectedLocation?.name || 'None'})</span>
                          <span className="font-medium">${hangarCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3">
                          <span className="font-semibold">Total Package</span>
                          <span className="text-2xl font-bold">${estimatedTotal.toFixed(2)}</span>
                        </div>
                        {cls.features?.benefits && (
                          <div className="pt-3">
                            <ul className="space-y-1 text-sm">
                              {cls.features.benefits.slice(0, 3).map((benefit: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary mt-0.5">✓</span>
                                  <span className="text-muted-foreground">{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground pt-2">
                          Per month. Specific aircraft may have custom pricing.
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Fine Print / Disclaimer */}
            <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
              <p className="text-sm text-center text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Representative Pricing:</strong> Prices shown are representative class packages including selected hangar costs. 
                Actual pricing may vary based on aircraft-specific requirements, travel costs, and facility availability. 
                Hangar costs confirmed during onboarding. Facility availability subject to final confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
