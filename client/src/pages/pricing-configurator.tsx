import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingConfigurator } from '@/components/pricing-configurator';

export default function PricingConfiguratorPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Membership Pricing Calculator</h1>
                <p className="text-sm text-muted-foreground">
                  Configure your aircraft and usage to see estimated monthly pricing
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Introduction */}
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Transparent, Feature-Based Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Our pricing is tailored to your specific aircraft's features and your monthly usage. 
              No hidden fees, no surprises — just comprehensive care for your investment.
            </p>
          </div>

          {/* Configurator */}
          <PricingConfigurator />

          {/* Additional Information */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Feature-Based</h3>
              <p className="text-sm text-muted-foreground">
                Pricing reflects your aircraft's specific systems and consumables, 
                not just the model year
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">All-Inclusive</h3>
              <p className="text-sm text-muted-foreground">
                TKS fluid, oxygen refills, and other consumables included based 
                on your aircraft's equipment
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Scalable</h3>
              <p className="text-sm text-muted-foreground">
                From light piston singles to jets, our tiered approach grows 
                with your aviation needs
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h3 className="text-2xl font-semibold text-center mb-8">
              Frequently Asked Questions
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  What's included in the operations coverage?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Operations coverage includes pre/post-flight inspections, aircraft movement, 
                  fueling coordination, cleaning after flights, and consumables management. 
                  For aircraft with TKS or oxygen systems, all fluid and gas replenishment 
                  is included.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Can I change my tier as my needs evolve?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Absolutely. Our membership tiers are flexible and can be adjusted monthly 
                  based on your usage patterns. Many owners start with basic care and upgrade 
                  as they fly more frequently.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Are there any additional fees?
                </h4>
                <p className="text-sm text-muted-foreground">
                  The calculator shows your complete monthly cost. The only additional charges 
                  would be for optional services like charter coordination, international trip 
                  planning, or major maintenance oversight beyond routine care.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  How accurate is this estimate?
                </h4>
                <p className="text-sm text-muted-foreground">
                  These estimates are based on typical usage patterns and our standard pricing. 
                  Your actual pricing may vary slightly based on specific aircraft configuration 
                  and unique requirements. Schedule a consultation for a detailed quote.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <div className="inline-flex flex-col items-center gap-4 p-8 bg-card rounded-lg border">
              <h3 className="text-xl font-semibold">
                Ready to experience premium aircraft management?
              </h3>
              <p className="text-muted-foreground max-w-md">
                Join Freedom Aviation and let us handle the details while you enjoy the freedom of flight.
              </p>
              <div className="flex gap-4">
                <Link to="/contact">
                  <Button size="lg">Schedule Tour</Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline">Start Application</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
