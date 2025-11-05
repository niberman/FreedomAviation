import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Sparkles } from "lucide-react";

export function MembershipTiers() {
  // Class I – Basic
  const classIBasic = {
    name: "Class I – Basic",
    price: 199,
    originalPrice: 350,
    aircraft: "For light piston aircraft such as C172, C182, Archer, Cherokee",
    features: [
      "1 full detail per month",
      "Weekly readiness & fluid top-offs",
      "Oil & basic maintenance oversight",
      "Avionics database updates",
      "Exterior & interior cleaning",
      "Hangar & ramp coordination",
      "Digital owner portal with logs & notifications"
    ]
  };

  // Class II – Premium
  const classIIPremium = {
    name: "Class II – Premium",
    price: 799,
    originalPrice: 1199,
    aircraft: "For high-performance / TAA aircraft such as SR20, DA40, Mooney",
    features: [
      "2 full details per month",
      "Pre-/post-flight readiness service",
      "Oil, TKS, and O₂ management",
      "Composite & paint care",
      "Avionics database management",
      "Priority scheduling for service",
      "Advanced maintenance tracking",
      "Quarterly aircraft performance review",
      "Discounted fuel coordination"
    ]
  };

  // Class III – Elite
  const classIIIElite = {
    name: "Class III – Elite",
    price: 1499,
    originalPrice: 2000,
    aircraft: "For turbine singles and light jets such as Vision Jet, TBM",
    features: [
      "Concierge-level readiness after every flight",
      "4 full details per month + post-flight wipes",
      "Turbine soot & brightwork care",
      "Oil, O₂, and TKS replenishment",
      "Comprehensive insurance coordination",
      "Priority maintenance slots",
      "Annual avionics & software updates",
      "Trip planning & logistics support",
      "Guaranteed aircraft availability"
    ]
  };

  // Turbo Founders Membership (Hero Product)
  const turboFounders = {
    name: "Turbo Founders Membership",
    price: 599,
    originalPrice: 1000,
    aircraft: "For SR22T Turbo owners",
    badge: "Founders Edition",
    features: [
      "Everything in Class II Premium, plus:",
      "Priority concierge line and personalized support",
      "Guaranteed 48-hour turnaround",
      "Dedicated maintenance management with proactive tracking",
      "Exclusive member events and brand partnerships",
      "Founding rate locked in for life"
    ]
  };

  const standardTiers = [classIBasic, classIIPremium, classIIIElite];

  return (
    <div className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold mb-3 md:mb-4">Membership Tiers</h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect level of service for your aircraft. Premium management with transparent, Colorado-based pricing.
          </p>
        </div>

        {/* Turbo Founders Hero Section */}
        <div className="mb-12 md:mb-16 max-w-4xl mx-auto">
          <Card className="relative overflow-hidden border-2 border-primary shadow-xl bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute top-3 right-3 md:top-4 md:right-4">
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs md:text-sm px-3 md:px-4 py-1 md:py-1.5 shadow-lg">
                <Star className="h-3 w-3 mr-1.5 fill-current" />
                {turboFounders.badge}
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
                    {turboFounders.aircraft}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-baseline gap-2 md:gap-3 mb-2">
                <span className="text-4xl md:text-5xl font-bold">{`$${turboFounders.price.toLocaleString()}`}</span>
                <span className="text-muted-foreground text-lg md:text-xl">/month</span>
                <Badge variant="secondary" className="text-xs">
                  <span className="line-through text-muted-foreground mr-2">
                    ${turboFounders.originalPrice}+
                  </span>
                  Exclusive Limited Rate
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground italic">
                Normally ${turboFounders.originalPrice}+ per month
              </p>
            </CardHeader>
            <CardContent className="relative pb-6 md:pb-8">
              <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                {turboFounders.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 md:gap-3">
                    <Check className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0 mt-0.5" />
                    <span className={`text-xs md:text-sm leading-relaxed ${i === 0 ? "font-semibold text-foreground" : ""}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-base md:text-lg py-5 md:py-6 shadow-lg"
                size="lg"
                onClick={() => (window.location.href = "/pricing")}
              >
                Claim Your Founders Rate
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Standard Tiers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          {standardTiers.map((tier, idx) => (
            <Card
              key={idx}
              className="hover-elevate transition-all border-2 hover:border-primary/50 flex flex-col h-full"
            >
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-xl md:text-2xl">{tier.name}</CardTitle>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground font-medium mb-3 md:mb-4 leading-snug">
                  {tier.aircraft}
                </p>
                <div className="flex items-baseline gap-1 md:gap-2 mb-1">
                  <span className="text-3xl md:text-4xl font-bold">{`$${tier.price.toLocaleString()}`}</span>
                  <span className="text-muted-foreground text-sm md:text-base">/month</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="line-through mr-2">${tier.originalPrice}+</span>
                  Introductory Rate
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pb-4 md:pb-6">
                <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-auto"
                  variant="outline"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
