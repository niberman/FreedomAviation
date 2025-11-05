"use client";

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Building2, Plane, Loader2, Star, Sparkles } from "lucide-react";
import { useClasses, useLocations } from "@/features/pricing/hooks";

export default function PricingFixed() {
  const [, navigate] = useLocation();
  
  // Fetch pricing data from database
  const { data: pricingClasses, isLoading: isLoadingClasses } = useClasses();
  const { data: locations, isLoading: isLoadingLocations } = useLocations();
  
  // Load hangar selection from localStorage
  const [selectedHangarId, setSelectedHangarId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fa:hangar') || 'none';
    }
    return 'none';
  });

  // Persist hangar selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fa:hangar', selectedHangarId);
    }
  }, [selectedHangarId]);

  // Transform database locations to hangar options format
  const hangarOptions = locations ? [
    {
      id: "none",
      slug: "none",
      name: "No Hangar",
      cost: 0,
      description: "I'll arrange my own hangar or tie-down",
      icon: Plane,
    },
    ...locations.map(loc => ({
      id: loc.slug,
      slug: loc.slug,
      name: loc.name,
      cost: loc.hangar_cost_monthly,
      description: loc.description || "Premium hangar facility",
      icon: Building2,
    }))
  ] : [];

  const selectedHangar = hangarOptions.find(h => h.id === selectedHangarId) || hangarOptions[0];
  const hangarCost = selectedHangar?.cost || 0;

  const handleContinue = (packageId: string) => {
    navigate(`/contact?source=pricing_${packageId}&hangar=${selectedHangarId}`);
  };

  // Show loading state
  if (isLoadingClasses || isLoadingLocations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  // Separate Turbo Founders from standard tiers
  const turboFounders = pricingClasses?.find(cls => 
    cls.slug === 'turbo-founders' || cls.features?.hero_product === true
  );
  
  const standardTiers = pricingClasses?.filter(cls => 
    cls.slug !== 'turbo-founders' && cls.features?.hero_product !== true
  ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">Simple, Transparent Pricing</h1>
            <p className="text-base md:text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Choose your service tier and hangar location. All costs included, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Step 1: Hangar Selection */}
      <section className="py-10 md:py-12 border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Step 1: Select Hangar Location</h2>
              <p className="text-sm md:text-base text-muted-foreground">Choose where your aircraft will be housed</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hangarOptions.map((hangar) => {
                const isSelected = selectedHangarId === hangar.id;
                const Icon = hangar.icon;
                
                return (
                  <Card 
                    key={hangar.id}
                    className={`cursor-pointer transition-all hover-elevate ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedHangarId(hangar.id)}
                    data-testid={`hangar-card-${hangar.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 md:h-5 md:w-5 ${hangar.id === 'none' ? 'text-muted-foreground' : 'text-primary'}`} />
                          <CardTitle className="text-base md:text-lg">{hangar.name}</CardTitle>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="ml-2 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs md:text-sm mt-1">
                        {hangar.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl md:text-2xl font-bold">
                          ${hangar.cost.toLocaleString()}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">/month</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Step 2: Package Selection */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Step 2: Choose Your Service Package</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                {selectedHangar.id !== 'none' 
                  ? `Prices shown include ${selectedHangar.name} hangar costs`
                  : 'Prices shown are base service rates (hangar not included)'}
              </p>
            </div>

            {/* Turbo Founders Hero Section */}
            {turboFounders && (
              <div className="mb-12 md:mb-16 max-w-4xl mx-auto">
                <Card className="relative overflow-hidden border-2 border-primary shadow-xl bg-gradient-to-br from-primary/5 via-background to-primary/5">
                  <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute top-3 right-3 md:top-4 md:right-4">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs md:text-sm px-3 md:px-4 py-1 md:py-1.5 shadow-lg">
                      <Star className="h-3 w-3 mr-1.5 fill-current" />
                      {turboFounders.features?.badge || "Founders Edition"}
                    </Badge>
                  </div>
                  <CardHeader className="relative pb-4 md:pb-6 pt-6 md:pt-8">
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex-1 pr-16">
                        <CardTitle className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                          {turboFounders.name}
                        </CardTitle>
                        <p className="text-sm md:text-base text-muted-foreground font-medium">
                          {turboFounders.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2 md:gap-3 mb-2">
                      <span className="text-4xl md:text-5xl font-bold">
                        ${(turboFounders.base_monthly + hangarCost).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground text-lg md:text-xl">/month</span>
                      <Badge variant="secondary" className="text-xs">
                        <span className="line-through text-muted-foreground mr-2">
                          ${((turboFounders.features?.original_price || 1000) + hangarCost).toLocaleString()}+
                        </span>
                        Exclusive Limited Rate
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs md:text-sm text-muted-foreground">
                      <div>Base service: ${turboFounders.base_monthly.toLocaleString()}</div>
                      {hangarCost > 0 && <div>Hangar: ${hangarCost.toLocaleString()}</div>}
                    </div>
                  </CardHeader>
                  <CardContent className="relative pb-6 md:pb-8">
                    <div className="flex-1 mb-6 md:mb-8">
                      <div className="text-xs md:text-sm font-medium mb-3">Includes:</div>
                      <ul className="space-y-2 md:space-y-3">
                        {(turboFounders.features?.benefits || []).map((benefit: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 md:gap-3">
                            <Check className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className={`text-xs md:text-sm leading-relaxed ${idx === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-base md:text-lg py-5 md:py-6 shadow-lg"
                      size="lg"
                      onClick={() => handleContinue(turboFounders.slug)}
                      data-testid={`button-continue-${turboFounders.slug}`}
                    >
                      Claim Your Founders Rate
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Standard Tiers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
              {standardTiers.map((pkg, index) => {
                const totalPrice = pkg.base_monthly + hangarCost;
                const originalPrice = (pkg.features?.original_price || 0) + hangarCost;

                return (
                  <Card 
                    key={pkg.id}
                    className="relative hover-elevate flex flex-col border-2 hover:border-primary/50 transition-all h-full"
                    data-testid={`package-card-${pkg.id}`}
                  >
                    <CardHeader className="pb-3 md:pb-4">
                      <CardTitle className="text-xl md:text-2xl">{pkg.name}</CardTitle>
                      <CardDescription className="min-h-[3rem] mt-2 text-xs md:text-sm leading-snug">
                        {pkg.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col pb-4 md:pb-6">
                      <div className="mb-4 md:mb-6">
                        <div className="flex items-baseline gap-1 md:gap-2 mb-1">
                          <span className="text-3xl md:text-4xl font-bold">${totalPrice.toLocaleString()}</span>
                          <span className="text-muted-foreground text-sm md:text-base">/month</span>
                        </div>
                        {pkg.features?.introductory_rate && originalPrice > totalPrice && (
                          <p className="text-xs text-muted-foreground mb-2">
                            <span className="line-through mr-2">${originalPrice.toLocaleString()}+</span>
                            Introductory Rate
                          </p>
                        )}
                        <div className="mt-2 text-xs md:text-sm text-muted-foreground">
                          <div>Base service: ${pkg.base_monthly.toLocaleString()}</div>
                          {hangarCost > 0 && <div>Hangar: ${hangarCost.toLocaleString()}</div>}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="text-xs md:text-sm font-medium mb-3">Includes:</div>
                        <ul className="space-y-2 md:space-y-3">
                          {(pkg.features?.benefits || []).map((benefit: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-xs md:text-sm text-muted-foreground leading-relaxed">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button 
                        className="w-full mt-auto" 
                        variant="outline"
                        onClick={() => handleContinue(pkg.slug)}
                        data-testid={`button-continue-${pkg.id}`}
                      >
                        Continue
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Disclaimer */}
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <p className="text-sm text-center text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Pricing Notice:</strong> All prices shown are introductory rates. 
                  Turbo Founders Membership founding rates are locked in for life. 
                  Final pricing confirmed during onboarding based on your specific aircraft and usage patterns.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
