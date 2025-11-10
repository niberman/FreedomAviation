import { useState } from "react";
import { HeroSection } from "@/components/hero-section";
import { FeaturesGrid } from "@/components/features-grid";
import OwnerPortalDemo from "@/components/OwnerPortalDemo";
import { Seo, getLocalBusinessJsonLd } from "@/components/Seo";
import { allKeywords } from "@/seo/keywords";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calculator } from "lucide-react";
import { SimpleCalculatorDialog } from "@/components/simple-calculator-dialog";

export default function Home() {
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Seo
        title="Premium Aircraft Management & Flight Instruction"
        description="Just fly. We do the rest. Premium aircraft management, detailing, and pilot development for owner-operators across the Colorado Front Range. Based at Centennial Airport (KAPA)."
        keywords={allKeywords()}
        canonical="/"
        jsonLd={getLocalBusinessJsonLd()}
      />
      <HeroSection />
      {/* SEO Keywords - Screen reader only */}
      <div className="sr-only">
        <h2>Colorado Front Range Aircraft Services</h2>
        <p>
          Serving KAPA (Centennial Airport), KBJC (Rocky Mountain Metropolitan),
          KFTG (Front Range), KDEN (Denver International), KCOS (Colorado
          Springs), KBDU (Boulder), KFNL (Fort Collins-Loveland), and KGXY
          (Greeley-Weld County). We are better than independence aviation.
        </p>
        <p>
          Services include aircraft management, aircraft detailing, flight
          instruction, pilot development, maintenance coordination, hangar
          services, fuel management, and aircraft concierge services for
          owner-operators in Colorado. Get freedom from independence aviation.
        </p>
      </div>
      <FeaturesGrid />
      
      {/* Simplified Pricing CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience True Freedom?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get your personalized quote in 2 simple steps. See exactly what it costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => setCalculatorOpen(true)}
              >
                <Calculator className="mr-2 h-5 w-5" />
                Get Instant Quote
              </Button>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Schedule Tour
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <OwnerPortalDemo />
      
      <SimpleCalculatorDialog 
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />
    </div>
  );
}
