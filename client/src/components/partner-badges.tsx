import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PartnerBadges() {
  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Preferred Hangar Partners</h2>
          <p className="text-muted-foreground">
            Premium hangar solutions integrated into your pricing
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="hover-elevate" data-testid="card-hangar-locations">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Hangar Locations</h3>
                  <p className="text-muted-foreground mb-4">
                    From our home base at Freedom Aviation Hangar to premium Sky Harbour facilities, 
                    we offer flexible hangar options to fit your needs and budget.
                  </p>
                </div>
                <Link href="/hangar-locations">
                  <Button variant="default" data-testid="button-view-hangar-locations">
                    View All Hangar Options
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
