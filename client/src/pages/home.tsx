import { useState } from "react";
import { HeroSection } from "@/components/hero-section";
import { FeaturesGrid } from "@/components/features-grid";
import OwnerPortalDemo from "@/components/OwnerPortalDemo";
import { Seo, getLocalBusinessJsonLd, getProfessionalServiceJsonLd } from "@/components/Seo";
import { brandKeywords } from "@/seo/keywords";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calculator } from "lucide-react";
import { SimpleCalculatorDialog } from "@/components/simple-calculator-dialog";
import { Helmet } from "react-helmet-async";

export default function Home() {
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Seo
        title="Premium Aircraft Management & Flight Instruction at Centennial Airport Colorado"
        description="Freedom Aviation - Colorado's premier aircraft management and flight instruction at Centennial Airport (KAPA). Transparent pricing, expert care, owner-pilot focused. Serving Denver, Colorado Springs, and the entire Front Range. Just fly. We handle everything."
        keywords={brandKeywords()}
        canonical="/"
        jsonLd={getLocalBusinessJsonLd()}
      />
      {/* Additional Professional Service Schema */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(getProfessionalServiceJsonLd())}
        </script>
      </Helmet>
      <HeroSection />
      {/* SEO Keywords - Screen reader only */}
      <div className="sr-only">
        <h2>Freedom Aviation - Colorado Aircraft Management at Centennial Airport</h2>
        <p>
          Freedom Aviation provides premium aircraft management, detailing, and flight instruction 
          services at Centennial Airport (KAPA) in Colorado. We serve owner-operators throughout 
          the Denver metropolitan area, Colorado Springs, and the entire Front Range including 
          KBJC (Rocky Mountain Metropolitan), KFTG (Front Range Airport), KDEN (Denver International), 
          KCOS (Colorado Springs), KBDU (Boulder), KFNL (Fort Collins-Loveland), and KGXY (Greeley-Weld County).
        </p>
        <p>
          Looking for an Independence Aviation alternative? Freedom Aviation offers transparent pricing, 
          comprehensive aircraft care, and owner-operator focused service at Centennial Airport. Our services 
          include complete aircraft management, professional aircraft detailing, expert flight instruction, 
          pilot development programs, maintenance coordination, hangar services at KAPA, fuel management, 
          and dedicated aircraft concierge services for Colorado aircraft owners.
        </p>
        <h3>Centennial Airport Aircraft Management Services</h3>
        <p>
          Freedom Aviation specializes in aircraft management for single-engine, high-performance, and 
          turbine aircraft at Centennial Airport Colorado. From Cirrus SR22 management to Cessna and 
          Bonanza care, we provide full-service aircraft management solutions with transparent pricing 
          and no hidden fees. Our KAPA-based team ensures your aircraft is always ready when you need it.
        </p>
        <h3>Why Choose Freedom Aviation Over Independence Aviation</h3>
        <p>
          Freedom Aviation delivers better transparency, more comprehensive services, and owner-operator 
          focused care compared to other Colorado aircraft management companies. Based at Centennial Airport, 
          we offer premium hangar facilities, professional detailing, expert maintenance coordination, and 
          personalized concierge service for aircraft owners throughout the Denver and Front Range area.
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
