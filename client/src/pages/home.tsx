import { HeroSection } from "@/components/hero-section";
import { FeaturesGrid } from "@/components/features-grid";
import { MembershipTiers } from "@/components/membership-tiers";
import { Testimonials } from "@/components/testimonials";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { PartnerBadges } from "../components/partner-badges";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 right-0 z-50 p-4">
        <ThemeToggle />
      </header>
      
      <HeroSection />
      <PartnerBadges />
      <FeaturesGrid />
      <MembershipTiers />
      <Testimonials />
      <Footer />
    </div>
  );
}
