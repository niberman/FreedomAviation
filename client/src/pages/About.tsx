import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Seo } from "@/components/Seo";
import { SEO_KEYWORDS } from "@/seo/keywords";
import { 
  Shield, 
  Eye, 
  Users, 
  Award,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import heroImage from "@assets/stock_images/premium_cirrus_sr22t_b2f4f8b8.jpg";
import aircraftImage from "@assets/stock_images/modern_sleek_aircraf_8d8e0a84.jpg";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="About Us - Premium Aircraft Management for Owner-Pilots"
        description="Learn about Freedom Aviation's mission to make aircraft ownership effortless, safe, and rewarding. Expert technical care with personalized concierge service for owner-pilots."
        keywords={[
          ...SEO_KEYWORDS.services,
          ...SEO_KEYWORDS.modifiers,
          "about Freedom Aviation",
          "aircraft management company",
          "owner-pilot services",
          "aviation team Colorado"
        ].join(", ")}
        canonical="/about"
      />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center animate-in fade-in duration-700">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-foreground">
            Just Fly. We Handle Everything.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Premium Aircraft Management for Owner-Pilots.
          </p>
          
          <Link href="/pricing">
            <Button 
              size="lg" 
              className="text-lg px-8"
              data-testid="button-view-memberships"
            >
              View Memberships
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Section 1: Our Mission */}
      <section className="py-20 md:py-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">Our Mission</h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                To make aircraft ownership effortless, safe, and rewarding by combining expert technical care with personalized concierge service.
              </p>
              <p>
                We believe every pilot should enjoy the freedom of flight without the burden of logistics, scheduling, or maintenance headaches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: What We Do */}
      <section className="py-20 md:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-in fade-in slide-in-from-left duration-700">
              <img 
                src={aircraftImage} 
                alt="Aircraft on ramp" 
                className="rounded-2xl shadow-lg w-full h-auto object-cover"
              />
            </div>
            
            <div className="animate-in fade-in slide-in-from-right duration-700">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">What We Do</h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Freedom Aviation offers tiered management memberships that scale with your aircraft and flying lifestyle.
              </p>
              
              <ul className="space-y-6">
                {[
                  "Maintenance oversight & readiness tracking",
                  "Detailing, fueling, and hangar coordination",
                  "Avionics database updates and digital log management",
                  "Trip planning and concierge services",
                  "Member portal for transparency and control"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Our Team */}
      <section className="py-20 md:py-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">Our Team</h2>
            <p className="text-lg text-muted-foreground leading-relaxed text-center">
              Our leadership and operations team bring together decades of experience in general aviation, instruction, and fleet management. From line technicians to flight instructors, every member of our crew shares one mission: to deliver a seamless, safety-first experience for every owner.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Our Values */}
      <section className="py-20 md:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">Our Values</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="hover-elevate">
                <CardContent className="px-8 py-10 text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-primary/10 p-4">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Safety Above All</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Precision, consistency, and care in every procedure.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="px-8 py-10 text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-primary/10 p-4">
                      <Eye className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Trust & Transparency</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Predictable pricing and open communication.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="px-8 py-10 text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-primary/10 p-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Pilot-Centric Service</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Tailored to real pilot needs — because we are pilots, too.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="px-8 py-10 text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-primary/10 p-4">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Excellence in Every Detail</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    From ramp presentation to avionics updates, nothing is overlooked.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: The Freedom Difference */}
      <section className="py-20 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">The Freedom Difference</h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed text-center">
              <p>
                Freedom Aviation isn't just management — it's membership.
              </p>
              <p>
                We scale with your mission — from piston to turbine — and deliver the same level of care found in corporate flight departments.
              </p>
              <p>
                Whether you're flying cross-country or around the patch, our systems, staff, and standards ensure your aircraft is always ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Founder's Note */}
      <section className="py-20 md:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <Card className="hover-elevate">
            <CardContent className="px-10 py-12 md:px-14 md:py-16">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-8">
                  <div className="text-2xl md:text-3xl font-bold text-center mb-8">
                    Founder's Note
                  </div>
                  
                  <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                    <p className="italic">
                      "Freedom Aviation began with a simple vision — to give pilots the same level of confidence and convenience that professional flight departments enjoy.
                    </p>
                    <p className="italic">
                      As pilots ourselves, we understand the pride and responsibility that come with aircraft ownership. Our goal is to remove the stress, not the control — allowing you to focus on what you love most: flying.
                    </p>
                    <p className="italic">
                      Every member, every aircraft, and every detail matters. We're building something more than a management company — we're building a community of aviators who value excellence, safety, and true freedom in flight."
                    </p>
                  </div>
                  
                  <div className="pt-6 border-t text-right">
                    <p className="font-semibold text-foreground">— Noah Berman</p>
                    <p className="text-sm text-muted-foreground">Founder & Managing Member</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 7: CTA */}
      <section className="py-20 md:py-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Experience True Freedom in Flight?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join our community of owner-pilots who trust Freedom Aviation for seamless aircraft management.
            </p>
            <Link href="/pricing">
              <Button 
                size="lg" 
                className="text-lg px-8"
                data-testid="button-join-now"
              >
                Join Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
