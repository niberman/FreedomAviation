import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Calculator, 
  Plane,
  Shield,
  Clock,
  Users,
  Zap,
  Phone
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { SEO_KEYWORDS, locationKeywords } from "@/seo/keywords";
import { UnifiedPricingCalculator } from "@/components/unified-pricing-calculator";
import { useLocations } from "../features/pricing/hooks";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import heroImage from "@assets/stock_images/premium_cirrus_sr22t_b2f4f8b8.jpg";

export default function Pricing() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const locationsQuery = useLocations();
  const [showFAQ, setShowFAQ] = useState(false);

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
      
      {/* Hero Section with Background */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/70" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
          <div className="max-w-5xl">
            <div className="space-y-4 sm:space-y-6">
              <Badge className="px-3 sm:px-4 py-1 text-xs sm:text-sm" variant="secondary">
                Transparent Pricing • No Hidden Fees
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
                Aircraft Management
                <span className="block text-primary">Made Simple</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl">
                Get an instant quote for premium aircraft management services at Centennial Airport. 
                Fair, transparent pricing that scales with your needs.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto"
                  onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Get Your Custom Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <a href="tel:+19706182094" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Call (970) 618-2094
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-8 sm:py-10 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base">Instant Quotes</h3>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Get accurate pricing in seconds</p>
            </div>
            
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base">No Hidden Fees</h3>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">What you see is what you pay</p>
            </div>
            
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base">Flexible Plans</h3>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Scale up or down anytime</p>
            </div>
            
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base">Month-to-Month</h3>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">No long-term contracts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Calculator Section - Now the main focus */}
      <section id="calculator" className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-10 md:mb-12 space-y-3 sm:space-y-4 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">Configure Your Package</h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Choose your service level, flight hours, and add-ons. See your exact monthly price instantly.
              </p>
            </div>

            {/* Calculator Card with Shadow */}
            <Card className="shadow-2xl border-0">
              <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12">
                <UnifiedPricingCalculator 
                  showAddons={true}
                  ctaText={user ? "Save Quote & Continue" : "Get Quote & Sign Up"}
                  onQuoteGenerated={() => {
                    if (user) {
                      navigate('/onboarding');
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-10 md:mb-12 space-y-3 sm:space-y-4 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Everything You Need, Nothing You Don't</h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Our comprehensive service packages are designed by pilots, for pilots
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {/* Essential Services */}
              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <Badge className="w-fit mb-2 text-xs sm:text-sm">Essential Services</Badge>
                  <CardTitle className="text-lg sm:text-xl">Core Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">Pre & post-flight services</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">Oil & fluid management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">Basic cleaning & tidy</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">Maintenance coordination</span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Services */}
              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <Badge className="w-fit mb-2 text-xs sm:text-sm" variant="secondary">Performance Services</Badge>
                  <CardTitle className="text-lg sm:text-xl">Enhanced Care</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">Everything in Essential</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">TKS fluid management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">Oxygen system service</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">Enhanced cleaning</span>
                  </div>
                </CardContent>
              </Card>

              {/* Elite Services */}
              <Card className="border-2 hover:border-primary/20 transition-colors relative sm:col-span-2 lg:col-span-1">
                <div className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3">
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs sm:text-sm">Most Popular</Badge>
                </div>
                <CardHeader className="p-4 sm:p-6">
                  <Badge className="w-fit mb-2 text-xs sm:text-sm" variant="default">Elite Services</Badge>
                  <CardTitle className="text-lg sm:text-xl">White-Glove Treatment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">Everything in Performance</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">Concierge services</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">Priority scheduling</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">VIP treatment</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                <div className="mb-4 md:mb-6">
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs sm:text-sm">
                    Questions? We're Here to Help
                  </Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
                  Talk to an Expert
                </h3>
                <p className="text-base sm:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
                  Get personalized guidance on the right package for your aircraft. 
                  Our team is ready to answer your questions.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                  <a href="tel:+19706182094" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto">
                      <Phone className="mr-2 h-5 w-5" />
                      Call (970) 618-2094
                    </Button>
                  </a>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto"
                    onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Or Get an Instant Quote
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6">
              Ready to Experience the Difference?
            </h2>
            <p className="text-lg sm:text-xl mb-6 md:mb-8 text-primary-foreground/90 px-4">
              Join Freedom Aviation today and see why owner-pilots choose us for hassle-free aircraft management.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              {user ? (
                <Link href="/onboarding" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto">
                    Complete Your Membership
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto"
                    onClick={() => navigate('/login')}
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <a href="tel:+19706182094" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto bg-white/10 hover:bg-white/20 border-white/30 text-white"
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      Call (970) 618-2094
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Compact FAQ Section */}
      {showFAQ && (
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold">Common Questions</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowFAQ(false)}>
                  Close
                </Button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="font-semibold text-sm sm:text-base mb-2">Is the pricing really all-inclusive?</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Yes! The price shown in the calculator includes all services, hangar costs (if selected), and regular maintenance coordination. No hidden fees.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="font-semibold text-sm sm:text-base mb-2">Can I tour the facilities before signing up?</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Absolutely! We encourage prospective members to visit our facilities at KAPA. Call us to schedule a personal tour.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="font-semibold text-sm sm:text-base mb-2">What aircraft types do you support?</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      We specialize in single and light twin-engine aircraft. Popular models include Cirrus, Cessna, Piper, Beechcraft, and Diamond aircraft.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}