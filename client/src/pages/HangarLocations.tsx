import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Building2, MapPin } from "lucide-react";
import { useLocations } from "../features/pricing/hooks";
import { Loader2 } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SEO_KEYWORDS } from "@/seo/keywords";

export default function HangarLocations() {
  const locationsQuery = useLocations();

  if (locationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  const locations = (locationsQuery.data || []).filter(loc => loc.slug !== 'none');

  return (
    <div className="min-h-screen">
      <Seo
        title="Hangar Locations - Premium Aircraft Storage at KAPA"
        description="Professional aircraft storage solutions at Centennial Airport. From our Freedom Aviation Hangar to premium Sky Harbour facilities, transparent pricing integrated into your management package."
        keywords={[
          ...SEO_KEYWORDS.services,
          ...SEO_KEYWORDS.modifiers,
          ...SEO_KEYWORDS.partners,
          'aircraft hangar KAPA',
          'Centennial Airport hangars',
          'aircraft storage Colorado',
          'premium hangar facilities'
        ]}
        canonical="/hangar-locations"
      />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-4 py-2 bg-white/20 rounded-full mb-6">
              <p className="text-sm font-medium">Hangar Partnerships</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Premium Hangar Locations
            </h1>
            <p className="text-xl mb-8 text-primary-foreground/90">
              Professional aircraft storage at Centennial Airport (KAPA). 
              All hangar costs are transparently included in your monthly pricing.
            </p>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30" data-testid="button-view-all-pricing">
                View All Pricing Options
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Location Cards */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Hangar Partners</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {locations.map((location) => (
                <Card key={location.id} className="hover-elevate" data-testid={`location-card-${location.slug}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-2xl">{location.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          KAPA · Centennial Airport
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-muted-foreground mb-4">
                        {location.description}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">${location.hangar_cost_monthly}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    </div>

                    {location.features?.amenities && location.features.amenities.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Amenities & Benefits</h4>
                        <div className="grid gap-3">
                          {location.features.amenities.map((amenity: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-muted-foreground">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link href={`/pricing?location=${location.slug}`}>
                      <Button className="w-full" variant="outline" data-testid={`button-view-pricing-${location.slug}`}>
                        View Pricing with {location.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Integrated Hangar Pricing?</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Complete Transparency</h3>
                  <p className="text-muted-foreground">
                    All hangar costs are clearly shown in your monthly package price. 
                    No hidden fees or surprise charges.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Single Point of Contact</h3>
                  <p className="text-muted-foreground">
                    One team manages both your aircraft services and hangar coordination. 
                    Streamlined communication and faster response times.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Flexible Options</h3>
                  <p className="text-muted-foreground">
                    Choose the hangar that fits your needs and budget. 
                    From our home base facility to premium partners.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Integrated Operations</h3>
                  <p className="text-muted-foreground">
                    Seamless coordination between maintenance, detailing, and hangar services. 
                    Your aircraft is always ready when you need it.
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
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Is hangar cost included in my monthly pricing?</h3>
                  <p className="text-muted-foreground">
                    Yes! All hangar costs are transparently included in our pricing calculator.
                    When you select a service package and hangar location, you see the complete monthly cost.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Can I use my own hangar or tie-down?</h3>
                  <p className="text-muted-foreground">
                    Absolutely! Select the "None" option when choosing your hangar location to see 
                    base service pricing without hangar costs. You can arrange your own storage solution.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">What's the difference between hangar locations?</h3>
                  <p className="text-muted-foreground">
                    Each location offers different amenities and pricing. Our Freedom Aviation Hangar provides 
                    the fastest service turnaround as our home base, while Sky Harbour offers premium amenities 
                    like climate control and concierge services.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Can I switch hangar locations later?</h3>
                  <p className="text-muted-foreground">
                    Yes, subject to availability. Contact us to discuss changing your hangar location.
                    Pricing will be adjusted based on the new location's monthly cost.
                  </p>
                </CardContent>
              </Card>
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
                name: "Is hangar cost included in my monthly pricing?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes! All hangar costs are transparently included in our pricing calculator. When you select a service package and hangar location, you see the complete monthly cost.",
                },
              },
              {
                "@type": "Question",
                name: "Can I use my own hangar or tie-down?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Absolutely! Select the 'None' option when choosing your hangar location to see base service pricing without hangar costs. You can arrange your own storage solution.",
                },
              },
              {
                "@type": "Question",
                name: "What's the difference between hangar locations?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Each location offers different amenities and pricing. Our Freedom Aviation Hangar provides the fastest service turnaround as our home base, while Sky Harbour offers premium amenities like climate control and concierge services.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
