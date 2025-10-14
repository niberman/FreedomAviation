import { HeroSection } from "@/components/hero-section";
import { FeaturesGrid } from "@/components/features-grid";
import { MembershipTiers } from "@/components/membership-tiers";
import { Testimonials } from "@/components/testimonials";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { PartnerBadges } from "../components/partner-badges";
import { Seo, getLocalBusinessJsonLd } from "@/components/Seo";
import { allKeywords } from "@/seo/keywords";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Seo
        title="Premium Aircraft Management & Flight Instruction"
        description="Just fly. We do the rest. Premium aircraft management, detailing, and pilot development for owner-operators across the Colorado Front Range. Based at Centennial Airport (KAPA)."
        keywords={allKeywords()}
        canonical="/"
        jsonLd={getLocalBusinessJsonLd()}
      />
      
      <header className="fixed top-0 right-0 z-50 p-4">
        <ThemeToggle />
      </header>
      
      <HeroSection />
      
      {/* SEO Keywords - Screen reader only */}
      <div className="sr-only">
        <h2>Colorado Front Range Aircraft Services</h2>
        <p>
          Serving KAPA (Centennial Airport), KBJC (Rocky Mountain Metropolitan), 
          KFTG (Front Range), KDEN (Denver International), KCOS (Colorado Springs), 
          KBDU (Boulder), KFNL (Fort Collins-Loveland), and KGXY (Greeley-Weld County).
        </p>
        <p>
          Services include aircraft management, aircraft detailing, flight instruction, 
          pilot development, maintenance coordination, hangar services, fuel management, 
          and aircraft concierge services for owner-operators in Colorado.
        </p>
      </div>
      
      <PartnerBadges />
      <FeaturesGrid />
      <MembershipTiers />
      <Testimonials />
      <Footer />
    </div>
  );
}
