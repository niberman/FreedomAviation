import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Building2, MapPin, CheckCircle2, ArrowRight, Calculator, Users, Plane } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SEO_KEYWORDS, locationKeywords } from "@/seo/keywords";
import { UnifiedPricingCalculator } from "@/components/unified-pricing-calculator";
import { useLocations } from "../features/pricing/hooks";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Pricing() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const locationsQuery = useLocations();
  const [showHangarInfo, setShowHangarInfo] = useState(false);

  const locations = (locationsQuery.data || []).filter(loc => loc.slug !== 'none');

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Aircraft Management Pricing - Get Your Custom Quote"
        description="Transparent aircraft management pricing with our instant quote calculator. Choose your service tier, flight hours, and hangar location. Premium services for owner-operators at Centennial Airport."
        keywords={[
          ...SEO_KEYWORDS.services,
          ...SEO_KEYWORDS.modifiers,
          "aircraft management pricing",
          "aviation cost calculator",
          "hangar rental KAPA",
          "membership pricing"
        ].join(", ")}
        canonical="/pricing"
      />
      
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get Your Instant Quote</h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
              Transparent pricing tailored to your needs. Build your custom package in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Calculator className="mr-2 h-5 w-5" />
                Calculate Your Price
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/30"
                onClick={() => setShowHangarInfo(!showHangarInfo)}
              >
                <Building2 className="mr-2 h-5 w-5" />
                View Hangar Options
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  3 Service Tiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  From Essential to Elite - choose the level of service that fits your needs
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Based on Flight Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fair pricing that scales with your actual aircraft usage
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Flexible Hangar Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Premium hangar facilities or bring your own storage solution
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Calculator Section */}
      <section id="calculator" className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Build Your Custom Package</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Select your service tier and estimated flight hours to see transparent monthly pricing. 
                Add premium services and hangar options to complete your package.
              </p>
            </div>

            <Card className="p-6">
              <UnifiedPricingCalculator 
                showAddons={true}
                ctaText={user ? "Save Quote & Continue" : "Get Quote & Sign Up"}
                onQuoteGenerated={() => {
                  if (user) {
                    navigate('/onboarding');
                  }
                }}
              />
            </Card>
          </div>
        </div>
      </section>

      {/* Hangar Locations Section (Collapsible) */}
      {showHangarInfo && locationsQuery.isSuccess && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 text-center">Premium Hangar Locations</h2>
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                Choose from our partner hangar facilities at Centennial Airport (KAPA). 
                All locations include premium amenities and 24/7 access.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {locations.map((location) => (
                  <Card key={location.id} className="hover-elevate">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="h-8 w-8 text-primary" />
                        <div>
                          <CardTitle className="text-2xl">{location.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            KAPA · Centennial Airport
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {location.description}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">${location.hangar_cost_monthly}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </div>

                      {location.features?.amenities && location.features.amenities.length > 0 && (
                        <div className="space-y-2">
                          {location.features.amenities.slice(0, 4).map((amenity: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Own Hangar Option */}
              <Card className="mb-12">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Plane className="h-8 w-8 text-primary mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Have Your Own Hangar?</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        No problem! You can use our management services with your existing hangar or tie-down. 
                        Simply select "No Hangar" in the calculator to see base service pricing.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setShowHangarInfo(false)}>
                        Hide Hangar Options
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Membership Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Freedom Aviation?</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-base mb-2">All-Inclusive Pricing</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No hidden fees or surprise charges. Your monthly price includes all services, 
                    hangar costs, and access to our premium facilities.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-base mb-2">Flexible Membership</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Scale up or down based on your needs. Change service tiers or add-ons 
                    anytime as your flying requirements evolve.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-base mb-2">Expert Team</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Professional pilots, certified mechanics, and dedicated support staff 
                    ensure your aircraft is always ready when you are.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-base mb-2">Owner Portal Access</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Track maintenance, schedule services, view invoices, and monitor your 
                    aircraft 24/7 through our modern web and mobile app.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 text-primary-foreground/90">
              Join the Freedom Aviation family and experience premium aircraft management 
              tailored to owner-operators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/onboarding">
                  <Button size="lg" variant="secondary">
                    Complete Your Membership
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button size="lg" variant="secondary">
                      Sign Up Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 border-white/30"
                    onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Back to Calculator
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-base mb-2">How accurate is the pricing calculator?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our calculator provides exact monthly pricing based on your selections. The price you see 
                    is the price you pay - no hidden fees or surprises.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-base mb-2">Can I change my plan later?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Yes! You can upgrade, downgrade, or modify your services anytime. Changes take effect 
                    at the start of your next billing cycle.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-base mb-2">What if I fly more or less than estimated?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We review usage quarterly and can adjust your plan accordingly. You're never locked 
                    into a specific hours band if your flying patterns change.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-base mb-2">Do I need to use your hangar facilities?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No, you can use our services with your own hangar or tie-down. Our hangar options 
                    are available for those who want the convenience of integrated facilities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}