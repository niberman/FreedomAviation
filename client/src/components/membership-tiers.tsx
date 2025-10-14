import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Building2, Plane, AlertCircle } from "lucide-react";
import { useLatestSnapshot, useLocations } from "../features/pricing/hooks";
import { FEATURE_PARTNER_SKY_HARBOUR, FEATURE_PARTNER_FA_HANGAR } from "../lib/flags";
import { useMemo } from "react";

export function MembershipTiers() {
  const [, setLocation] = useLocation();
  const snapshotQuery = useLatestSnapshot();
  const locationsQuery = useLocations();

  const handleConfigureClick = () => {
    console.log("Configure membership clicked");
    // TODO: remove mock functionality - open Freedom Configurator modal
  };

  if (snapshotQuery.isLoading || locationsQuery.isLoading) {
    return (
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Error states
  if (snapshotQuery.isError || locationsQuery.isError) {
    return (
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to load pricing</h3>
            <p className="text-muted-foreground">
              Please try again later or contact us for pricing information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const classes = snapshotQuery.data?.payload?.classes || [];
  const locations = locationsQuery.data || [];
  const hangarLocations = locations.filter(loc => loc.slug !== 'none');

  // Memoize hangar location lookups
  const hangarMap = useMemo(() => {
    return {
      skyHarbour: hangarLocations.find(loc => loc.slug === 'sky-harbour'),
      faHangar: hangarLocations.find(loc => loc.slug === 'fa-hangar')
    };
  }, [hangarLocations]);

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-semibold mb-4">Service Packages</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect level of service for your aircraft. Transparent pricing, Colorado-based.
          </p>
        </div>
        
        {/* Service Class Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {classes.length > 0 ? (
            classes.map((cls: any, idx: number) => (
              <Card 
                key={cls.id} 
                className={idx === 1 ? "border-primary shadow-lg" : ""}
                data-testid={`package-card-${cls.slug}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-2xl">{cls.name}</CardTitle>
                    {idx === 1 && (
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {cls.description || 'Premium aircraft management'}
                  </p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${cls.base_monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">+ hangar costs</p>
                </CardHeader>
                <CardContent>
                  {cls.features?.benefits && (
                    <ul className="space-y-3 mb-6">
                      {cls.features.benefits.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button 
                    className="w-full" 
                    variant={idx === 1 ? "default" : "outline"}
                    onClick={() => setLocation('/pricing')}
                    data-testid={`button-select-${cls.slug}`}
                  >
                    See Full Pricing
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center text-muted-foreground py-8">
              <p>Pricing packages coming soon. Contact us for details.</p>
            </div>
          )}
        </div>

        {/* Hangar Partners Section */}
        {(FEATURE_PARTNER_SKY_HARBOUR || FEATURE_PARTNER_FA_HANGAR) && hangarLocations.length > 0 && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Preferred Hangar Partners</h3>
              <p className="text-muted-foreground">
                Premium hangar solutions integrated into your package pricing
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {FEATURE_PARTNER_SKY_HARBOUR && hangarMap.skyHarbour && (
                <Link href="/partners/sky-harbour">
                  <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-partner-sky-harbour">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">Sky Harbour @ KAPA</h3>
                          <p className="text-sm text-muted-foreground">
                            Purpose-built private hangars • ${hangarMap.skyHarbour.hangar_cost_monthly}/mo
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {FEATURE_PARTNER_FA_HANGAR && hangarMap.faHangar && (
                <Link href="/partners/freedom-aviation-hangar">
                  <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-partner-fa-hangar">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Plane className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">Freedom Aviation Hangar</h3>
                          <p className="text-sm text-muted-foreground">
                            Our home base at KAPA • ${hangarMap.faHangar.hangar_cost_monthly}/mo
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
