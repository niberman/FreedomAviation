"use client";

import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

export default function PricingFixed() {
  const [, navigate] = useLocation();


  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
              Every aircraft is unique. Get a personalized quote based on your specific aircraft features, expected usage, and hangar preferences.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-6 h-auto"
              onClick={() => navigate('/pricing-configurator')}
            >
              Start Pricing Configurator
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What's Included</h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive aircraft management services tailored to your needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Aircraft Readiness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Pre-flight inspections, fluid top-offs (oil, TKS, oxygen), and post-flight services to keep your aircraft always ready.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Detailing & Cleaning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Regular detailing services, interior cleaning, and exterior washing based on your flight hours and preferences.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Maintenance Coordination
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Scheduling coordination, maintenance tracking, and oversight to ensure your aircraft stays airworthy and compliant.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Hangar Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Climate-controlled hangar options, ramp coordination, and secure aircraft storage at premium locations.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <Button 
                size="lg"
                onClick={() => navigate('/pricing-configurator')}
              >
                Get Your Personalized Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Notice */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <Card className="border-0 bg-transparent shadow-none">
              <CardContent className="p-6">
                <p className="text-sm text-center text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Pricing Notice:</strong> Our configurator provides personalized quotes based on your aircraft features, expected monthly flight hours, and hangar location. Final pricing is confirmed during onboarding. All costs are transparent with no hidden fees.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
