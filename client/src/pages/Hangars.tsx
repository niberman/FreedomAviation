import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Loader2, Building2, MapPin } from "lucide-react";
import { useEffect } from "react";
import { useLocations } from "@/features/pricing/hooks";
import { Seo, getBreadcrumbJsonLd, getFAQJsonLd } from "@/components/Seo";
import { locationKeywords } from "@/seo/keywords";
import { Helmet } from "react-helmet-async";

export default function Hangars() {
  const { data: locations, isLoading } = useLocations();
  
  useEffect(() => {
    // Track page view
    console.log("Combined hangars page viewed");
  }, []);

  // Find both hangar locations
  const skyHarbour = locations?.find(loc => loc.slug === 'sky-harbour');
  const faHangar = locations?.find(loc => loc.slug === 'freedom-aviation-hangar' || loc.slug === 'f9');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const faqData = [
    {
      question: "What hangar options are available?",
      answer: "We offer two premium hangar locations at KAPA (Centennial Airport): Sky Harbour, our preferred partner facility with purpose-built infrastructure, and our Freedom Aviation home-base hangar for fastest service response times. Both offer identical premium amenities."
    },
    {
      question: "How is hangar cost included in pricing?",
      answer: "Hangar costs are transparently included in our pricing calculator and reflected in your monthly management fee. The specific cost varies by location and is clearly shown when you configure your pricing."
    },
    {
      question: "What amenities are included at both locations?",
      answer: "Both hangar locations include climate control, 24/7 access, secure facilities, concierge service, aircraft detailing, direct ramp access, and comprehensive maintenance support. The amenities and service quality are identical at both locations."
    },
    {
      question: "How do I choose between the two hangars?",
      answer: "The choice primarily comes down to availability and your preference for location. Our Freedom Aviation Hangar offers fastest service response as it's our operational hub, while Sky Harbour provides purpose-built infrastructure. Use our pricing calculator to see current availability and pricing for each location."
    }
  ];

  const sharedBenefits = [
    {
      icon: CheckCircle2,
      title: "Climate Controlled",
      description: "Protect your investment with professional-grade climate-controlled hangar space"
    },
    {
      icon: CheckCircle2,
      title: "24/7 Access",
      description: "Round-the-clock access to your aircraft whenever you need it"
    },
    {
      icon: CheckCircle2,
      title: "Secure Facility",
      description: "State-of-the-art security measures to keep your aircraft safe"
    },
    {
      icon: CheckCircle2,
      title: "Concierge Service",
      description: "Premium concierge support for all your aircraft management needs"
    },
    {
      icon: CheckCircle2,
      title: "Aircraft Detailing",
      description: "Professional aircraft detailing services to keep your aircraft looking pristine"
    },
    {
      icon: CheckCircle2,
      title: "Direct Ramp Access",
      description: "Convenient direct access to the ramp for quick turnarounds"
    },
    {
      icon: CheckCircle2,
      title: "Maintenance Support",
      description: "On-site maintenance support and coordination services"
    },
    {
      icon: CheckCircle2,
      title: "Transparent Pricing",
      description: "Hangar costs transparently included in your monthly management fee"
    }
  ];

  return (
    <div className="min-h-screen">
      <Seo
        title="Premium Aircraft Hangars at KAPA - Sky Harbour & Freedom Aviation"
        description="Two premium hangar locations at Centennial Airport (KAPA). Climate-controlled, secure, 24/7 access with full aircraft management services. Choose Sky Harbour or Freedom Aviation Hangar."
        keywords={locationKeywords("Hangars")}
        canonical="/hangars"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(getBreadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Hangars", url: "/hangars" }
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
              <p className="text-sm font-medium">Premium Hangar Facilities</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Your Aircraft's Home at KAPA
            </h1>
            <p className="text-xl mb-8 text-primary-foreground/90">
              Two exceptional hangar options at Centennial Airport. Climate-controlled, secure, 
              and integrated into your monthly aircraft management plan.
            </p>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30">
                View Pricing & Availability
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hangar Comparison Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Choose Your Hangar Location</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Sky Harbour */}
              <Card className="border-2 hover:border-primary/50 transition-all">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
                      <Building2 className="h-4 w-4" />
                      Preferred Partner
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Sky Harbour</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>Centennial Airport (KAPA)</span>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      Purpose-built private hangar infrastructure with premium amenities. 
                      Professionally managed facility integrated into your monthly plan.
                    </p>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Purpose-built infrastructure</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Premium facility management</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">All premium amenities included</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Climate controlled environment</span>
                    </div>
                  </div>

                  <Link href="/pricing?location=sky-harbour">
                    <Button className="w-full" size="lg">
                      View Sky Harbour Pricing
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Freedom Aviation Hangar */}
              <Card className="border-2 hover:border-primary/50 transition-all">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                      <Building2 className="h-4 w-4" />
                      FA Home Base
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Freedom Aviation Hangar</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>Centennial Airport (KAPA)</span>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      Our operational hub for fastest service response times. Direct coordination 
                      with our team for seamless aircraft management.
                    </p>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Fastest service turnaround</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Direct team coordination</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">All premium amenities included</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Climate controlled environment</span>
                    </div>
                  </div>

                  <Link href="/pricing?location=freedom-aviation-hangar">
                    <Button className="w-full" size="lg" variant="outline">
                      View FA Hangar Pricing
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Note */}
            <div className="mt-12 text-center">
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-8">
                  <p className="text-lg text-muted-foreground">
                    Both locations offer identical premium amenities and service quality. 
                    Pricing varies by location and is transparently shown in our pricing calculator.
                  </p>
                  <Link href="/pricing">
                    <Button variant="link" className="mt-4">
                      Compare pricing for both locations →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Shared Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Premium Amenities at Both Locations</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Regardless of which hangar you choose, you'll enjoy the same exceptional 
                facilities and services at Centennial Airport.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sharedBenefits.map((benefit, index) => (
                <Card key={index} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <benefit.icon className="h-8 w-8 text-green-600 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
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
              {faqData.map((faq, index) => (
                <div key={index} className="border-b pb-6 last:border-0">
                  <h3 className="font-semibold text-lg mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Experience Premium Aircraft Management?
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
              Get a personalized quote based on your aircraft and preferred hangar location.
              Transparent pricing, no hidden fees.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg" variant="secondary">
                  Get Your Custom Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

