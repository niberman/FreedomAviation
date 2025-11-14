import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Seo, getBreadcrumbJsonLd } from "@/components/Seo";
import { brandKeywords } from "@/seo/keywords";
import { 
  Plane,
  Wrench,
  GraduationCap,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Phone
} from "lucide-react";
import heroImage from "@assets/stock_images/premium_cirrus_sr22t_b2f4f8b8.jpg";
import aircraftImage from "@assets/stock_images/modern_sleek_aircraf_8d8e0a84.jpg";
import { Helmet } from "react-helmet-async";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="About Freedom Aviation - Colorado Aircraft Management Experts at KAPA"
        description="Learn about Freedom Aviation's mission to make aircraft ownership effortless at Centennial Airport Colorado. Expert aircraft management, transparent pricing, and personalized service for owner-pilots across the Front Range since 2024."
        keywords={brandKeywords()}
        canonical="/about"
      />
      {/* Breadcrumb Schema */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(getBreadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "About", url: "/about" }
          ]))}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 text-center animate-in fade-in duration-700">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 text-foreground leading-tight">
            About Freedom Aviation
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            Stop worrying about your airplane—and start flying it the way you imagined.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto"
                data-testid="button-view-memberships"
              >
                View Memberships
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
      </section>

      {/* Section 1: Introduction */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
              <p>
                Freedom Aviation exists so you can stop worrying about your airplane—and start flying it the way you imagined when you first got your certificate.
              </p>
              <p>
                We're a premium aircraft management, detailing, and flight instruction company based at Centennial Airport (KAPA) in Denver, Colorado. Our focus is simple: owner-pilots who want airline-level professionalism for their personally flown aircraft.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: What We Do */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-10 md:mb-12 text-center">What We Do</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Aircraft Management */}
              <Card className="hover-elevate">
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Wrench className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">Aircraft Management & Ground Support</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    We coordinate maintenance, track inspections and ADs, handle avionics database updates, manage TKS/O₂/oil, and stage your aircraft before each flight. You keep the keys—we keep everything else organized and ready.
                  </p>
                </CardContent>
              </Card>

              {/* Flight Instruction */}
              <Card className="hover-elevate">
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">Flight Instruction & Proficiency</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    We provide transition training, IPCs, flight reviews, and ongoing proficiency programs tailored to how and where you fly, with scenario-based training grounded in real-world operations.
                  </p>
                </CardContent>
              </Card>

              {/* Detailing */}
              <Card className="hover-elevate sm:col-span-2 lg:col-span-1">
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">Detailing & Appearance Care</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Regular washes, leading-edge and bug removal, interior cleaning, and premium detailing keep your aircraft looking sharp and feeling new every time you open the door.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Looking Ahead */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 text-center">Looking Ahead</h2>
            <div className="space-y-4 sm:space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
              <p>
                Freedom Aviation is built to grow with our members. As our community expands, we plan to develop additional services that support owners who want more flexibility and utilization from their aircraft.
              </p>
              <p>
                We are actively exploring offerings such as:
              </p>
              <ul className="space-y-3 sm:space-y-4 ml-4 sm:ml-6">
                <li className="flex items-start gap-2 sm:gap-3">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
                  <span><strong>Aircraft leaseback programs</strong> to help offset ownership costs while keeping your airplane professionally managed</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <Plane className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
                  <span><strong>Part 135 partnerships and charter solutions</strong> for owners who want more options for how their aircraft is flown and by whom</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
                  <span><strong>In-house aircraft maintenance services</strong> with trusted A&P mechanics who know your aircraft and integrate seamlessly with our management operations</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
                  <span><strong>Comprehensive flight school and primary instruction programs</strong> to train the next generation of pilots using professionally managed aircraft and experienced CFIs</span>
                </li>
              </ul>
              <p className="text-xs sm:text-sm italic">
                These services are not active yet, but they shape how we design our systems, processes, and software today—so that when we launch them, they plug directly into the same high standard of care our members already know.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Our Team */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-10 md:mb-12 text-center">Our Team</h2>
            
            <div className="grid gap-6 sm:gap-8 max-w-5xl mx-auto">
              {/* Noah Berman */}
              <Card className="hover-elevate">
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold">Noah Berman</h3>
                    <p className="text-primary font-medium text-sm sm:text-base">Founder & CEO</p>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Noah Berman is a commercial multi-engine pilot and software developer who built the entire custom platform that powers Freedom Aviation's operations, membership management, and aircraft tracking. With experience flying out of Centennial and working closely with local owners, Noah founded Freedom Aviation to bring flight-department structure to single-aircraft operators. He focuses on connecting pilots, processes, and technology so every detail behind the scenes supports safer, smoother flying.
                  </p>
                </CardContent>
              </Card>

              {/* Daniel Sterling */}
              <Card className="hover-elevate">
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold">Daniel Sterling</h3>
                    <p className="text-primary font-medium text-sm sm:text-base">Founder, Chief Mechanic & Ground Operations</p>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Daniel leads aircraft readiness, ground operations, and line support across all member aircraft. He oversees safe towing, precise staging, fluid checks, covers, and cabin presentation so airplanes are always ready when owners arrive. Daniel's standards show up in the details—clean leading edges, clear windscreens, tidy interiors—and in the result: reliable, repeatable quality on every flight.
                  </p>
                </CardContent>
              </Card>

              {/* Sean Comstock */}
              <Card className="hover-elevate">
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold">Sean Comstock</h3>
                    <p className="text-primary font-medium text-sm sm:text-base">Founder, Chief Pilot</p>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Sean is an ATP-rated pilot and CFI/CFII who designs and oversees Freedom Aviation's training and proficiency programs. He brings thousands of hours of real-world experience and a calm, structured teaching style focused on practical skills, not just checkride maneuvers. By aligning training with each owner's mission and aircraft, Sean helps pilots fly more confidently and safely in the conditions and environments they actually face.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Why Owner-Pilots Choose Us */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-10 text-center">Why Owner-Pilots Choose Us</h2>
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      One trusted team for aircraft care, ground ops, and training
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Predictable, membership-style service instead of piecemeal vendors
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Peace of mind knowing your airplane is clean, current, and ready to go
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-10 sm:mt-12 p-6 sm:p-8 md:p-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground italic">
                "When you walk into the hangar, your only question should be: 
                <span className="block mt-2 text-primary">Where are we flying today?"</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: CTA */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Experience True Freedom in Flight?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
              Join our community of owner-pilots who trust Freedom Aviation for seamless aircraft management.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto"
                  data-testid="button-join-now"
                >
                  View Pricing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
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
      </section>
    </div>
  );
}
