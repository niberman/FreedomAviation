import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

export default function SkyHarbour() {
  useEffect(() => {
    // Track page view
    console.log("Sky Harbour partner page viewed");
  }, []);

  return (
    <div className="min-h-screen">
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
                  <h3 className="font-semibold text-lg mb-2">Purpose-Built Infrastructure</h3>
                  <p className="text-muted-foreground">
                    Modern facilities designed specifically for Centennial Airport operations
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Transparent Pricing</h3>
                  <p className="text-muted-foreground">
                    Hangar costs ($2,000/mo) included in your monthly management fee
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Secure & Climate-Controlled</h3>
                  <p className="text-muted-foreground">
                    Protect your investment with professional-grade hangar space
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Streamlined Management</h3>
                  <p className="text-muted-foreground">
                    Single point of contact for aircraft management and hangar coordination
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
                  and reflected in your monthly management fee. The default hangar cost is $2,000/month.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-2">Do prices vary by hangar location?</h3>
                <p className="text-muted-foreground">
                  Yes. Our pricing engine accounts for different hangar partnerships. Sky Harbour
                  has different economics than our Freedom Aviation Hangar or tie-down options.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-2">What makes Sky Harbour a preferred partner?</h3>
                <p className="text-muted-foreground">
                  Sky Harbour provides purpose-built, high-quality infrastructure at Centennial Airport,
                  allowing us to deliver premium service with predictable costs and excellent security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Is hangar cost included in pricing?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes! Sky Harbour hangar costs are transparently included in our pricing calculator and reflected in your monthly management fee. The default hangar cost is $2,000/month.",
                },
              },
              {
                "@type": "Question",
                name: "Do prices vary by hangar location?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Our pricing engine accounts for different hangar partnerships. Sky Harbour has different economics than our Freedom Aviation Hangar or tie-down options.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
