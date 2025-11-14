import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useLocations } from "@/features/pricing/hooks";
import { Seo, getLocalBusinessJsonLd, getBreadcrumbJsonLd, getFAQJsonLd } from "@/components/Seo";
import { locationKeywords } from "@/seo/keywords";
import { Helmet } from "react-helmet-async";

export default function SkyHarbour() {
  const { data: locations, isLoading } = useLocations();
  
  useEffect(() => {
    // Track page view
    console.log("Sky Harbour partner page viewed");
  }, []);

  // Find Sky Harbour location pricing
  const skyHarbour = locations?.find(loc => loc.slug === 'sky-harbour');
  const hangarCost = skyHarbour?.hangar_cost_monthly || 2000; // Fallback to 2000

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const faqData = [
    {
      question: "Is hangar cost included in pricing?",
      answer: `Yes! Sky Harbour hangar costs are transparently included in our pricing calculator and reflected in your monthly management fee. The hangar cost is $${hangarCost.toLocaleString()}/month.`
    },
    {
      question: "Do prices vary by hangar location?",
      answer: "Yes. Both hangar locations offer the same premium amenities and benefits, but pricing varies based on location. Sky Harbour hangar costs are $2,000/month, while the Freedom Aviation Hangar is priced at $1,500/month. Both include all the same amenities."
    },
    {
      question: "What makes Sky Harbour a preferred partner?",
      answer: "Sky Harbour provides purpose-built, high-quality infrastructure at Centennial Airport with the same premium amenities as our Freedom Aviation Hangar. Both locations offer climate control, 24/7 access, secure facilities, concierge service, and all other premium benefits."
    }
  ];

  return (
    <div className="min-h-screen">
      <Seo
        title="Sky Harbour Hangar at KAPA - Premium Aircraft Management"
        description="Premium aircraft hangar at Sky Harbour KAPA (Centennial Airport). Climate-controlled, 24/7 access, secure facility with full aircraft management services. Transparent pricing from $2,000/month."
        keywords={locationKeywords("Sky Harbour")}
        canonical="/partners/sky-harbour"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(getBreadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Partners", url: "/partners" },
            { name: "Sky Harbour", url: "/partners/sky-harbour" }
          ]))}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(getFAQJsonLd(faqData))}
        </script>
      </Helmet>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-4 py-2 bg-white/20 rounded-full mb-6">
              <p className="text-sm font-medium">Preferred Hangar Partner</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Freedom Aviation × Sky Harbour
            </h1>
            <p className="text-xl mb-8 text-primary-foreground/90">
              Purpose-built private hangars at KAPA, integrated into your monthly plan.
              Hangar economics are modeled directly in pricing.
            </p>
            <Link href="/pricing?location=sky-harbour">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30" data-testid="button-view-pricing">
                See Pricing @ Sky Harbour
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Premium Hangar Benefits</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Climate Controlled</h3>
                  <p className="text-muted-foreground">
                    Protect your investment with professional-grade climate-controlled hangar space
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">24/7 Access</h3>
                  <p className="text-muted-foreground">
                    Round-the-clock access to your aircraft whenever you need it
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Secure Facility</h3>
                  <p className="text-muted-foreground">
                    State-of-the-art security measures to keep your aircraft safe
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Concierge Service</h3>
                  <p className="text-muted-foreground">
                    Premium concierge support for all your aircraft management needs
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Aircraft Detailing</h3>
                  <p className="text-muted-foreground">
                    Professional aircraft detailing services to keep your aircraft looking pristine
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Direct Ramp Access</h3>
                  <p className="text-muted-foreground">
                    Convenient direct access to the ramp for quick turnarounds
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Maintenance Support</h3>
                  <p className="text-muted-foreground">
                    On-site maintenance support and coordination services
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Fuel Discount</h3>
                  <p className="text-muted-foreground">
                    Competitive fuel pricing with discount benefits
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Transparent Pricing</h3>
                  <p className="text-muted-foreground">
                    Hangar costs (${hangarCost.toLocaleString()}/mo) included in your monthly management fee
                  </p>
                </CardContent>
              </Card>
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
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-2">Is hangar cost included in pricing?</h3>
                <p className="text-muted-foreground">
                  Yes! Sky Harbour hangar costs are transparently included in our pricing calculator
                  and reflected in your monthly management fee. The hangar cost is ${hangarCost.toLocaleString()}/month.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-2">Do prices vary by hangar location?</h3>
                <p className="text-muted-foreground">
                  Yes. Both hangar locations offer the same premium amenities and benefits, but pricing varies 
                  based on location. Sky Harbour hangar costs are ${hangarCost.toLocaleString()}/month, while 
                  the Freedom Aviation Hangar is priced at $1,500/month. Both include all the same amenities.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-2">What makes Sky Harbour a preferred partner?</h3>
                <p className="text-muted-foreground">
                  Sky Harbour provides purpose-built, high-quality infrastructure at Centennial Airport with 
                  the same premium amenities as our Freedom Aviation Hangar. Both locations offer climate control, 
                  24/7 access, secure facilities, concierge service, and all other premium benefits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
