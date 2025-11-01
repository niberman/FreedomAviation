"use client";

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Building2, Plane, Loader2 } from "lucide-react";
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

  // Transform pricing classes to packages format
  const packages = pricingClasses?.map((cls, index) => ({
    id: cls.slug,
    title: cls.name,
    examples: cls.description ? [cls.description] : [],
    baseMonthly: cls.base_monthly,
    includes: cls.features?.benefits || [],
    isPopular: index === 1 && pricingClasses.length === 3, // Middle package
  })) || [];

  return (
    <div className="min-h-screen bg-background">
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

      {/* Step 1: Hangar Selection */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Step 1: Select Hangar Location</h2>
              <p className="text-muted-foreground">Choose where your aircraft will be housed</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
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
                          <Icon className={`h-5 w-5 ${hangar.id === 'none' ? 'text-muted-foreground' : 'text-primary'}`} />
                          <CardTitle className="text-lg">{hangar.name}</CardTitle>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="ml-2">
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm mt-1">
                        {hangar.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          ${hangar.cost.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">/month</span>
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
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-2">Step 2: Choose Your Service Package</h2>
              <p className="text-muted-foreground">
                {selectedHangar.id !== 'none' 
                  ? `Prices shown include ${selectedHangar.name} hangar costs`
                  : 'Prices shown are base service rates (hangar not included)'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg, index) => {
                const totalPrice = pkg.baseMonthly + hangarCost;
                const isMiddle = pkg.isPopular;

                return (
                  <Card 
                    key={pkg.id}
                    className={`relative hover-elevate flex flex-col ${isMiddle ? 'ring-2 ring-primary scale-105' : ''}`}
                    data-testid={`package-card-${pkg.id}`}
                  >
                    {isMiddle && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge variant="default" className="px-4">Most Popular</Badge>
                      </div>
                    )}
                    
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl">{pkg.title}</CardTitle>
                      <CardDescription className="min-h-[3rem]">
                        {pkg.examples.join(", ")}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col">
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">${totalPrice.toLocaleString()}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <div>Base service: ${pkg.baseMonthly.toLocaleString()}</div>
                          <div>Hangar: ${hangarCost.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="text-sm font-medium mb-3">Includes:</div>
                        <ul className="space-y-2">
                          {pkg.includes.slice(0, 5).map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button 
                        className="w-full mt-6" 
                        variant={isMiddle ? "default" : "outline"}
                        onClick={() => handleContinue(pkg.id)}
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
            <Card className="mt-12 bg-muted/50">
              <CardContent className="p-6">
                <p className="text-sm text-center text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Pricing Notice:</strong> Prices shown are representative packages based on 0-10 flight hours per month. 
                  Costs scale with flight hours using the multipliers shown. Final pricing confirmed during onboarding based on your specific aircraft and usage patterns.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
