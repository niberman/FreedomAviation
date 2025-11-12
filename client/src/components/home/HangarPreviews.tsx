import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink, MapPin } from "lucide-react";
import { useLocations } from "@/features/pricing/hooks";
import { useAuth } from "@/lib/auth-context";
import { RequestServiceSheet } from "@/components/request-service-sheet";

/**
 * Home: Hangar Previews (derived from existing /hangars grid + partner pages)
 * - Shows two featured locations (Sky Harbour & FA Hangar if present; else first two locations)
 * - CTAs: Explore Facility (internal page), View Pricing (preselected), Request Staging (login-guard)
 * - If hero images are not present in /public/images/hangar, uses a gradient fallback
 */

const PARTNER_ROUTES: Record<string, string> = {
  "sky-harbour": "/partners/sky-harbour",
  "fa-hangar": "/partners/fa-hangar",
};

const IMG_BY_SLUG: Record<string, string> = {
  "sky-harbour": "/images/hangar/skyharbour-hero.jpg",
  "fa-hangar": "/images/hangar/fa-hero.jpg",
};

const SKY_URL = import.meta.env.VITE_SKY_HARBOUR_URL || "https://www.skyharbour.group/";

function TileImage({ slug, alt }: { slug: string; alt: string }) {
  const src = IMG_BY_SLUG[slug];
  if (!src) {
    return (
      <div className="h-48 w-full rounded-xl bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-900" />
    );
  }
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img src={src} alt={alt} className="h-48 w-full rounded-xl object-cover md:h-56" loading="lazy" decoding="async" />;
}

export default function HangarPreviews() {
  const { user } = useAuth();
  const [requestOpen, setRequestOpen] = useState(false);
  const { data: locations = [] } = useLocations();

  const featured = useMemo(() => {
    const bySlug = new Map(locations.map((l: any) => [l.slug, l]));
    const picks = ["sky-harbour", "fa-hangar"].map(s => bySlug.get(s)).filter(Boolean) as any[];
    if (picks.length < 2) {
      for (const l of locations) {
        if (!picks.find(p => p.id === l.id)) picks.push(l);
        if (picks.length >= 2) break;
      }
    }
    return picks.slice(0, 2);
  }, [locations]);

  if (!featured.length) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Hangar Experience</h2>
              <p className="mt-1 text-muted-foreground">
                Co-branded facilities and concierge staging for owner-pilots at KAPA.
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="ghost" className="gap-2">View pricing & hangars</Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((loc: any) => {
              const partnerHref = PARTNER_ROUTES[loc.slug] || null;
              return (
                <Card key={loc.id} className="hover-elevate">
                  <CardContent className="space-y-4 p-4 md:p-6">
                    <TileImage slug={loc.slug} alt={`${loc.name} hangar`} />
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{loc.name}</h3>
                        <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="gap-1"><MapPin className="h-4 w-4"/>{loc.address ?? "KAPA – Centennial"}</Badge>
                          <Badge variant="outline" className="gap-1"><Building2 className="h-4 w-4"/>Partner</Badge>
                        </div>
                      </div>
                      {loc.slug === "sky-harbour" && (
                        <a href={SKY_URL} target="_blank" rel="noreferrer noopener" className="hidden md:inline-flex">
                          <Button size="sm" variant="outline" className="gap-2 rounded-xl">
                            Sky Harbour <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {partnerHref && (
                        <Link href={partnerHref}>
                          <Button className="rounded-xl">Explore Facility</Button>
                        </Link>
                      )}
                      <Link href={`/pricing?location=${loc.slug}`}>
                        <Button variant="secondary" className="rounded-xl">View Pricing</Button>
                      </Link>
                      {user ? (
                        <Button variant="outline" className="rounded-xl" onClick={() => setRequestOpen(true)}>
                          Request Staging
                        </Button>
                      ) : (
                        <Link href={`/login?next=/&intent=request-staging`}>
                          <Button variant="outline" className="rounded-xl">Request Staging</Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/** Request sheet for logged-in users (opened by CTA) */}
      {/** You can pass a default aircraft here if you store one on the profile */}
      {/** This keeps it mounted at home level for a smooth UX */}
      {/** It will no-op for logged-out users (button links to login) */}
      {/** */}
      {/** */}
      {/** */}
      {/** */}
      {/** */}
      {/* eslint-disable-next-line react/jsx-no-undef */}
      {/* @ts-ignore – RequestServiceSheet prop type varies in your codebase */}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/**/}
      {/* Mounted sheet */}
      {/**/}
      {/* @ts-ignore */}
      {/**/}
      {/**/}
      {/* Real mount: */}
      {/**/}
      {/**/}
      {/* eslint-enable */}
      {/* Render only when logged in */}
      {/* @ts-ignore */}
      {/* The component exists at client/src/components/request-service-sheet.tsx */}
      {/* It expects open/onOpenChange; aircraft is optional */}
      {/* Adjust props if your local signature differs */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {/* */}
      {user && (
        <RequestServiceSheet 
          open={requestOpen} 
          onOpenChange={setRequestOpen}
          aircraft={{ id: undefined, tailNumber: "N/A", make: "Unknown", model: "Unknown" }}
        />
      )}
    </section>
  );
}
