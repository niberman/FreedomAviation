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
    <section id="owner-portal-demo" className="bg-muted/30 py-12 md:py-16 lg:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-2">{headline}</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-2">{subhead}</p>

          <Card className="overflow-hidden shadow-lg">
            <div className="relative w-full aspect-[4/3] sm:aspect-video max-h-[500px] sm:max-h-[600px] md:max-h-[700px] lg:max-h-[800px] overflow-hidden">
              <iframe
                src="/demo?readonly=1&seed=DEMO"
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
