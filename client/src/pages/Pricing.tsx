import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Seo } from "@/components/Seo";
import { locationKeywords } from "@/seo/keywords";
import { isFixedPricing } from "@/lib/flags";
import PricingFixed from "@/components/PricingFixed";
import { UnifiedPricingCalculator } from "@/components/unified-pricing-calculator";

export default function Pricing() {
  // If fixed pricing mode is enabled, use the fixed component
  if (isFixedPricing) {
    return <PricingFixed />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Transparent Pricing - Aircraft Management Packages"
        description="Get a personalized quote for premium aircraft management services. Our configurator helps you see exactly what it costs based on your aircraft and preferences."
        keywords={locationKeywords()}
        canonical="/pricing"
      />
      
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Get your quote in 2 simple steps. No hidden fees, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Pricing Calculator */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <UnifiedPricingCalculator />
        </div>
      </section>

      {/* Feature Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Feature-Based</h3>
                <p className="text-sm text-muted-foreground">
                  Pricing reflects your aircraft's specific systems and consumables, 
                  not just the model year
                </p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">All-Inclusive</h3>
                <p className="text-sm text-muted-foreground">
                  TKS fluid, oxygen refills, and other consumables included based 
                  on your aircraft's equipment
                </p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Scalable</h3>
                <p className="text-sm text-muted-foreground">
                  From light piston singles to jets, our tiered approach grows 
                  with your aviation needs
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-background">
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
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  What's included in operations & consumables?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  This monthly fee covers staging labor (pre/post-flight prep, aircraft movement, 
                  fueling coordination, cleaning) and all consumables based on your estimated monthly 
                  flight hours. For aircraft with TKS or oxygen systems, all fluid and gas replenishment 
                  is included.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Can I change my tier as my needs evolve?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Absolutely. Our membership tiers are flexible and can be adjusted monthly 
                  based on your usage patterns. Many owners start with basic care and upgrade 
                  as they fly more frequently.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Are there any additional fees?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  The calculator shows your complete monthly cost. The only additional charges 
                  would be for optional services like charter coordination, international trip 
                  planning, or major maintenance oversight beyond routine care.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  How accurate is this estimate?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  These estimates are based on typical usage patterns and our standard pricing. 
                  Your actual pricing may vary slightly based on specific aircraft configuration 
                  and unique requirements. Schedule a consultation for a detailed quote.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Notice */}
      <section className="py-12 bg-background">
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
