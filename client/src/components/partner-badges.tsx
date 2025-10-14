import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Plane } from "lucide-react";
import { FEATURE_PARTNER_SKY_HARBOUR, FEATURE_PARTNER_FA_HANGAR } from "../lib/flags";

export function PartnerBadges() {
  if (!FEATURE_PARTNER_SKY_HARBOUR && !FEATURE_PARTNER_FA_HANGAR) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Preferred Hangar Partners</h2>
          <p className="text-muted-foreground">
            Premium hangar solutions integrated into your pricing
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {FEATURE_PARTNER_SKY_HARBOUR && (
            <Link href="/partners/sky-harbour">
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-partner-sky-harbour">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Sky Harbour</h3>
                      <p className="text-sm text-muted-foreground">
                        Purpose-built private hangars • $2,000/mo
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {FEATURE_PARTNER_FA_HANGAR && (
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
                        Our home base at KAPA • $1,500/mo
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
