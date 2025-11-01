import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Building2, Plane, Loader2 } from "lucide-react";
import { useClasses, useLocations } from "@/features/pricing/hooks";

export function MembershipTiers() {
  // Fetch pricing data from database
  const { data: pricingClasses, isLoading: isLoadingClasses } = useClasses();
  const { data: locations, isLoading: isLoadingLocations } = useLocations();

  // Show loading state
  if (isLoadingClasses || isLoadingLocations) {
    return (
      <div className="py-20">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Transform pricing classes to tiers format
  const tiers = pricingClasses?.map((cls, index) => ({
    name: cls.name,
    aircraft: cls.description || '',
    price: `$${cls.base_monthly.toLocaleString()}`,
    popular: index === 1 && pricingClasses.length === 3, // Middle tier is popular
    features: cls.features?.benefits || [],
  })) || [];

  // Transform locations to hangar partners format
  const activePartners = locations?.filter(loc => loc.slug !== 'none').map(loc => ({
    name: loc.name,
    slug: loc.slug,
    description: loc.description || 'Premium hangar facility',
    price: `$${loc.hangar_cost_monthly.toLocaleString()}/mo`,
    enabled: true,
    icon: Building2,
  })) || [];

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-semibold mb-4">Service Packages</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect level of service for your aircraft. Transparent
            pricing, Colorado-based.
          </p>
        </div>

        {/* Service Class Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier, idx) => (
            <Card
              key={idx}
              className={tier.popular ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  {tier.popular && (
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {tier.aircraft}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  + hangar costs
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  onClick={() => (window.location.href = "/pricing")}
                  data-testid={`button-configure-${tier.name.toLowerCase()}`}
                >
                  See Full Pricing
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Hangar Partners Section */}
        {activePartners.length > 0 && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">
                Preferred Hangar Partners
              </h3>
              <p className="text-muted-foreground">
                Premium hangar solutions integrated into your package pricing
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {activePartners.map((partner) => (
                <Link
                  key={partner.slug}
                  href={`/pricing?hangar=${partner.slug}`}
                >
                  <Card
                    className="hover-elevate cursor-pointer transition-all"
                    data-testid={`card-partner-${partner.slug}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <partner.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {partner.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {partner.description} • {partner.price}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
