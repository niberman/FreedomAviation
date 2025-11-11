import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Plane, Clock, Shield, Star, Sparkles, Info, TrendingUp, Zap, Award } from "lucide-react";
import { Seo, getFAQJsonLd, getBreadcrumbJsonLd } from "@/components/Seo";
import { brandKeywords } from "@/seo/keywords";
import { isFixedPricing } from "@/lib/flags";
import PricingFixed from "@/components/PricingFixed";
import { UnifiedPricingCalculator } from "@/components/unified-pricing-calculator";
import { Helmet } from "react-helmet-async";
import {
  PRICING_TIERS,
  HOURS_BANDS,
  CORE_FEATURES,
  AVAILABLE_ADDONS,
  calculateMonthlyPrice,
  type PricingTier,
  type HoursRange,
} from "@/lib/unified-pricing";

export default function Pricing() {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [selectedHours, setSelectedHours] = useState<HoursRange | null>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);

  // If fixed pricing mode is enabled, use the fixed component
  if (isFixedPricing) {
    return <PricingFixed />;
  }

  const scrollToCalculator = (tier?: PricingTier, hours?: HoursRange) => {
    if (tier) setSelectedTier(tier);
    if (hours) setSelectedHours(hours);
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // FAQ data for structured data
  const pricingFAQs = [
    {
      question: "How does tier-based pricing work?",
      answer: "Your tier is based on aircraft complexity and systems. Light aircraft (Cessna 172, Cherokee) start at $850/month. High-performance aircraft (SR22, Bonanza) with advanced avionics and systems start at $1,650/month. Turbine aircraft (TBM, Vision Jet) start at $3,200/month. Pricing reflects the additional systems, consumables, and expertise required."
    },
    {
      question: "What affects my monthly price?",
      answer: "Two main factors: (1) Your aircraft tier, and (2) Your monthly flight hours. Higher usage means more frequent service, more detailing, and more consumables. A high-performance aircraft flying 50+ hours per month requires significantly more care than one flying 10 hours per month, which is reflected in the pricing multiplier."
    },
    {
      question: "What consumables are included?",
      answer: "All system-specific consumables are included: oil top-offs, TKS fluid for de-ice equipped aircraft, oxygen refills, window cleaner, interior detailing products, and more. If your aircraft has it, we service it. No surprise bills for routine consumables."
    },
    {
      question: "Can I change tiers or usage levels?",
      answer: "Absolutely. Your tier is set based on your aircraft, but your usage level can be adjusted monthly with 30 days notice. Many members adjust seasonally—flying more in summer months and less in winter, or vice versa depending on their mission."
    },
    {
      question: "Are there any hidden fees?",
      answer: "None. The price you see in the calculator is your total monthly management cost (hangar is separate and depends on location). The only additional costs would be for optional add-on services you choose, major maintenance that you approve in advance, or if you exceed your usage band significantly."
    },
    {
      question: "What about hangar costs?",
      answer: "Hangar costs are location-dependent and billed separately for transparency. At our primary KAPA (Centennial) location, climate-controlled hangar space ranges from $400-800/month depending on aircraft size and hangar type. We can also manage your aircraft at your preferred location."
    },
    {
      question: "How do I get started?",
      answer: "Use our calculator above to get your personalized quote, then create an account. Our team will reach out within 24 hours to schedule a consultation, discuss your specific needs, and finalize your membership. Most aircraft are onboarded within 7-10 days."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <Seo
        title="Transparent Aircraft Management Pricing - Freedom Aviation Colorado"
        description="Freedom Aviation offers transparent, all-inclusive aircraft management pricing at Centennial Airport. Choose your tier, select your usage level, and get your personalized quote instantly. No hidden fees. Based at KAPA serving all of Colorado."
        keywords={brandKeywords()}
        canonical="/pricing"
      />
      {/* Structured Data */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(getFAQJsonLd(pricingFAQs))}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(getBreadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Pricing", url: "/pricing" }
          ]))}
        </script>
      </Helmet>
      
      {/* Streamlined Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Instant Quote • No Hidden Fees
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Your Aircraft,
              <br />
              Your Perfect Price
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Configure your ideal aircraft management plan in 60 seconds
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="py-8 bg-muted/40 border-y">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">3</div>
                <div className="text-sm text-muted-foreground">Aircraft Tiers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">3</div>
                <div className="text-sm text-muted-foreground">Usage Levels</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">60s</div>
                <div className="text-sm text-muted-foreground">To Get Quote</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">$0</div>
                <div className="text-sm text-muted-foreground">Hidden Fees</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Pricing Configurator - MAIN FEATURE */}
      <section ref={calculatorRef} className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="h-3 w-3 mr-1" />
              Interactive Configurator
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Build Your Perfect Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Select your aircraft type, monthly usage, and optional enhancements to see your personalized quote
            </p>
          </div>
          <UnifiedPricingCalculator 
            defaultTier={selectedTier || 'performance'}
            defaultHours={selectedHours || '20-50'}
          />
        </div>
      </section>

      {/* Tier Details - Simplified */}
      <section id="tiers" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Pricing Tiers Explained</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Each tier is designed for specific aircraft types and complexity levels
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {PRICING_TIERS.map((tier, idx) => {
                const isPopular = tier.id === 'performance';
                const Icon = idx === 0 ? Plane : idx === 1 ? Zap : Award;
                return (
                  <Card 
                    key={tier.id}
                    className={`relative group hover:shadow-2xl transition-all duration-300 cursor-pointer ${
                      isPopular ? 'border-2 border-primary shadow-lg md:scale-105' : 'hover:border-primary/50'
                    }`}
                    onClick={() => scrollToCalculator(tier.id)}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-primary text-primary-foreground shadow-md">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    
                    <CardHeader className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${isPopular ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{tier.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tier.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Price Range */}
                      <div className="bg-muted/50 rounded-lg p-4 mb-4">
                        <div className="text-sm text-muted-foreground mb-1">Starting from</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-primary">
                            ${tier.baseMonthly.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Up to ${calculateMonthlyPrice(tier.id, '50+').toLocaleString()}/mo for heavy usage
                        </div>
                      </div>

                      {/* Example Aircraft */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tier.examples.map((example) => (
                          <Badge key={example} variant="outline" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="relative z-10">
                      <div className="space-y-2 mb-6">
                        {(tier.premiumFeatures && tier.premiumFeatures.length > 0 
                          ? tier.premiumFeatures.slice(0, 4) 
                          : CORE_FEATURES.slice(0, 4)
                        ).map((feature, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature.name}</span>
                          </div>
                        ))}
                        <div className="text-xs text-muted-foreground pt-2">
                          + All core features included
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full group-hover:shadow-lg transition-shadow"
                        variant={isPopular ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToCalculator(tier.id);
                        }}
                      >
                        Configure {tier.name}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* What's Included - Streamlined */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">All Plans Include</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Every tier comes with comprehensive aircraft management services
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CORE_FEATURES.slice(0, 8).map((feature, i) => (
                <div 
                  key={i}
                  className="flex flex-col items-center text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-3 rounded-full bg-primary/10 mb-3">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-sm">
                    {feature.name}
                  </h3>
                  {feature.description && (
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button 
                variant="outline"
                onClick={() => scrollToCalculator()}
              >
                See Full Feature List in Configurator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Compact FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">
              Common Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {pricingFAQs.slice(0, 6).map((faq, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base flex items-start gap-2">
                      <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:32px_32px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">
              Ready to Get Started?
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-primary-foreground/90">
              Configure your plan and get your personalized quote in 60 seconds
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-10 py-7 h-auto shadow-2xl hover:shadow-xl transition-shadow"
                onClick={() => scrollToCalculator()}
              >
                <Zap className="mr-2 h-5 w-5" />
                Build Your Plan
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Instant quote
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                No hidden fees
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
