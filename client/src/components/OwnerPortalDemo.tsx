import { Card } from "@/components/ui/card";

interface OwnerPortalDemoProps {
  headline?: string;
  subhead?: string;
}

export default function OwnerPortalDemo({
  headline = "Freedom Owner Portal",
  subhead = "Your aircraft dashboard — live, intelligent, effortless."
}: OwnerPortalDemoProps) {
  return (
    <section id="owner-portal-demo" className="bg-muted/30 py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{headline}</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{subhead}</p>

          <Card className="overflow-hidden shadow-lg">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src="/demo?readonly=1&seed=N123FA"
                title="Freedom Owner Portal Demo"
                className="absolute inset-0 w-full h-full border-0"
                referrerPolicy="no-referrer"
                allow="clipboard-read; clipboard-write"
                data-testid="iframe-owner-portal-demo"
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
