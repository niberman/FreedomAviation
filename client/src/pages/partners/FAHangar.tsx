import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useLocations } from "@/features/pricing/hooks";
import { Seo, getLocalBusinessJsonLd, getBreadcrumbJsonLd, getFAQJsonLd } from "@/components/Seo";
import { locationKeywords } from "@/seo/keywords";
import { Helmet } from "react-helmet-async";

export default function FAHangar() {
  const { data: locations, isLoading } = useLocations();
  
  useEffect(() => {
    // Track page view
    console.log("Freedom Aviation Hangar partner page viewed");
  }, []);

  // Find FA Hangar location pricing
  const faHangar = locations?.find(loc => loc.slug === 'freedom-aviation-hangar' || loc.slug === 'f9');
  const hangarCost = faHangar?.hangar_cost_monthly; // Dynamic pricing - may be undefined

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const faqData = [
    {
      question: "What is the Freedom Aviation Hangar?",
      answer: "Our dedicated hangar facility at KAPA where we provide integrated aircraft management and storage services. It serves as our operational hub for maintenance and service coordination."
    },
    {
      question: "How does hangar pricing work?",
      answer: hangarCost 
        ? `The Freedom Aviation Hangar has a cost of $${hangarCost.toLocaleString()}/month, which is transparently reflected in our pricing calculator. This is included in your total monthly management fee.`
        : "Freedom Aviation Hangar pricing varies based on availability and specific requirements. Contact us for current rates. Pricing is transparently included in your total monthly management fee."
    },
    {
      question: "Why choose FA Hangar over other options?",
      answer: `Being housed at our home base facility means faster service response times and direct coordination with our team. Both our hangar and Sky Harbour offer the same premium amenities and benefits, with the main difference being pricing and location${hangarCost ? ` at a competitive rate of $${hangarCost.toLocaleString()}/month` : '. Contact us for current pricing'}.`
    }
  ];

  return (
    <div className="min-h-screen">
      <Seo
        title="Freedom Aviation Hangar at KAPA - Our Home Base Facility"
        description="Freedom Aviation's dedicated hangar facility at Centennial Airport (KAPA). Climate-controlled, secure, 24/7 access with integrated aircraft management services. Fast service response times at our operational hub."
        keywords={locationKeywords("Freedom Aviation Hangar")}
        canonical="/partners/fa-hangar"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(getBreadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Partners", url: "/partners" },
            { name: "Freedom Aviation Hangar", url: "/partners/fa-hangar" }
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
              <p className="text-sm font-medium">FA Home Base</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Freedom Aviation Hangar
            </h1>
            <h2 className="text-2xl mb-6 text-primary-foreground/90">
              KAPA · Centennial Airport
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90">
              Our home-base hangar option—fast turns, predictable access.
              We model the hangar line directly in your monthly price.
            </p>
            <Link href="/pricing?location=freedom-aviation-hangar">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30" data-testid="button-view-pricing">
                See Pricing @ FA Hangar
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
                  <h3 className="font-semibold text-lg mb-2">Streamlined Operations</h3>
                  <p className="text-muted-foreground">
                    Located at our operational base for fastest service turnaround times
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
                <h3 className="font-semibold text-lg mb-2">What is the Freedom Aviation Hangar?</h3>
                <p className="text-muted-foreground">
                  Our dedicated hangar facility at KAPA where we provide integrated aircraft management
                  and storage services. It serves as our operational hub for maintenance and service coordination.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-2">How does hangar pricing work?</h3>
                <p className="text-muted-foreground">
                  {hangarCost ? (
                    <>The Freedom Aviation Hangar has a cost of ${hangarCost.toLocaleString()}/month, which is transparently
                    reflected in our pricing calculator. This is included in your total monthly management fee.</>
                  ) : (
                    <>Freedom Aviation Hangar pricing varies based on availability and specific requirements. 
                    Contact us for current rates and to discuss your aircraft's needs. Pricing is transparently 
                    included in your total monthly management fee.</>
                  )}
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-2">Why choose FA Hangar over other options?</h3>
                <p className="text-muted-foreground">
                  Being housed at our home base facility means faster service response times and direct
                  coordination with our team. Both our hangar and Sky Harbour offer the same premium amenities 
                  and benefits, with the main difference being pricing and location. The Freedom Aviation Hangar 
                  provides the same climate control, 24/7 access, secure facilities, concierge service, and all 
                  other premium benefits{hangarCost ? ` at a competitive rate of $${hangarCost.toLocaleString()}/month` : '. Contact us for current pricing'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
