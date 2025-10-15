import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import heroImage from "@assets/stock_images/premium_cirrus_sr22t_b2f4f8b8.jpg";
import logoImage from "@assets/freedom-aviation-logo.png";

export function HeroSection() {
  const [, setLocation] = useLocation();
  
  const handleOpenPortal = () => {
    setLocation("/login");
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={logoImage} alt="Freedom Aviation" className="h-12 w-auto" />
          <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Freedom Aviation
          </span>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 text-foreground">
          Just fly.<br />We do the rest.
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Premium aircraft management, detailing, and pilot development for owner-operators across the Front Range.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            onClick={() => setLocation("/contact?source=hero_cta")}
            data-testid="button-see-plans"
            className="text-lg px-8"
          >
            See Plans & Start
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={handleOpenPortal}
            data-testid="button-owner-portal"
            className="text-lg px-8 backdrop-blur-sm bg-background/30"
          >
            Owner Portal
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground">
          KAPA-Based • 1000+ Flights Managed • Available 24/7
        </div>
      </div>
    </div>
  );
}
