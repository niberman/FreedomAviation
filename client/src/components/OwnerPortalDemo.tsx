import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OwnerPortalDemoProps {
  srcMp4?: string;
  srcWebm?: string;
  poster?: string;
  headline?: string;
  subhead?: string;
}

export default function OwnerPortalDemo({
  srcMp4 = "/videos/owner-portal-demo.mp4",
  srcWebm = "/videos/owner-portal-demo.webm",
  poster = "/images/owner-portal-preview.jpg",
  headline = "Freedom Owner Portal",
  subhead = "Your aircraft dashboard — live, intelligent, effortless."
}: OwnerPortalDemoProps) {
  const [showModal, setShowModal] = useState(false);

  const handleOpenDemo = () => {
    setShowModal(true);
    // Track analytics if available
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({ event: 'cta_click', cta: 'open_live_demo' });
    }
  };

  const handleCloseDemo = () => {
    setShowModal(false);
  };

  return (
    <>
      <section id="owner-portal-demo" className="bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{headline}</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{subhead}</p>

            <Card className="overflow-hidden shadow-lg">
              <video
                autoPlay
                loop
                muted
                playsInline
                poster={poster}
                className="w-full"
                data-testid="video-owner-portal-demo"
              >
                <source src={srcMp4} type="video/mp4" />
                {srcWebm && <source src={srcWebm} type="video/webm" />}
                Your browser does not support the video tag.
              </video>
            </Card>

            <Button 
              size="lg"
              className="mt-8"
              onClick={handleOpenDemo}
              data-testid="button-open-demo"
            >
              Try the Live Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Demo Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={handleCloseDemo}
          data-testid="modal-demo"
        >
          <div 
            className="relative w-full max-w-7xl h-[85vh] bg-background rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="default"
              size="sm"
              className="absolute top-3 right-3 z-10"
              onClick={handleCloseDemo}
              data-testid="button-close-demo"
            >
              Close
            </Button>
            <iframe
              src="/demo?readonly=1&seed=N123FA"
              title="Freedom Owner Portal Demo"
              className="w-full h-full border-0"
              referrerPolicy="no-referrer"
              allow="clipboard-read; clipboard-write"
              data-testid="iframe-demo"
            />
          </div>
        </div>
      )}
    </>
  );
}
