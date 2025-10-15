import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Class I",
    aircraft: "C182 / Archer / Cherokee",
    price: "$200",
    features: [
      "Weekly readiness checks",
      "1 full detail/month",
      "Fluid top-offs",
      "Avionics DB updates",
      "Digital portal access",
    ],
  },
  {
    name: "Class II",
    aircraft: "SR22 / SR22T / DA40 / Mooney",
    price: "$550",
    popular: true,
    features: [
      "2x weekly readiness",
      "2 full details/month",
      "Priority scheduling",
      "All Class I features",
      "Maintenance coordination",
    ],
  },
  {
    name: "Class III",
    aircraft: "Vision / TBM",
    price: "$1,000",
    features: [
      "Daily readiness checks",
      "Unlimited detailing",
      "Dedicated concierge",
      "All Class II features",
      "White-glove service",
    ],
  },
];

export function MembershipTiers() {
  const handleConfigureClick = () => {
    console.log("Configure membership clicked");
    // TODO: remove mock functionality - open Freedom Configurator modal
  };

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-semibold mb-4">Membership Tiers</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect level of service for your aircraft class.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  onClick={handleConfigureClick}
                  data-testid={`button-configure-${tier.name.toLowerCase()}`}
                >
                  Configure Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-accent/50">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Freedom+ Concierge</h3>
              <p className="text-sm text-muted-foreground">
                Add personalized concierge service to any tier for just
                $200/month
              </p>
            </div>
            <Button
              onClick={handleConfigureClick}
              data-testid="button-add-concierge"
            >
              Add to Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
