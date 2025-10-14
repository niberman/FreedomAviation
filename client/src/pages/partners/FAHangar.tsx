import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

export default function FAHangar() {
  useEffect(() => {
    // Track page view
    console.log("Freedom Aviation Hangar partner page viewed");
  }, []);

  return (
    <div className="min-h-screen">
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
            <h2 className="text-3xl font-bold mb-8 text-center">Home Base Advantages</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Streamlined Operations</h3>
                  <p className="text-muted-foreground">
                    Located at our operational base for fastest service turnaround times
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Cost-Effective Pricing</h3>
                  <p className="text-muted-foreground">
                    Competitive hangar rate ($1,500/mo) transparently included in management fees
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Priority Access</h3>
                  <p className="text-muted-foreground">
                    Direct access to our maintenance and service teams on-site
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Integrated Management</h3>
                  <p className="text-muted-foreground">
                    Seamless coordination between aircraft management and hangar services
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
                  The Freedom Aviation Hangar has a default cost of $1,500/month, which is transparently
                  reflected in our pricing calculator. This is included in your total monthly management fee.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-2">Why choose FA Hangar over other options?</h3>
                <p className="text-muted-foreground">
                  Being housed at our home base facility means faster service response times, direct
                  coordination with our team, and competitive pricing compared to premium hangar partners.
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
                name: "What is the Freedom Aviation Hangar?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Our dedicated hangar facility at KAPA where we provide integrated aircraft management and storage services. It serves as our operational hub for maintenance and service coordination.",
                },
              },
              {
                "@type": "Question",
                name: "How does hangar pricing work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The Freedom Aviation Hangar has a default cost of $1,500/month, which is transparently reflected in our pricing calculator. This is included in your total monthly management fee.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
