import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import heroImage from "@assets/stock_images/premium_cirrus_sr22t_b2f4f8b8.jpg";
import logoImage from "@assets/falogo.png";

export function HeroSection() {
  const [, setLocation] = useLocation();
  
  const handleOpenPortal = () => {
    setLocation("/login");
  };

  return (
    <div className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
        role="img"
        aria-label="Premium Cirrus SR22T aircraft at Centennial Airport ready for flight"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <img 
            src={logoImage} 
            alt="Freedom Aviation Logo - Premium Aircraft Management Colorado" 
            className="h-8 sm:h-10 md:h-12 w-auto"
            loading="eager"
          />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Freedom Aviation
          </span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 text-foreground">
          Just fly.<br />We do the rest.
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
          Premium aircraft management, detailing, and pilot development for owner-operators across the Front Range.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              data-testid="button-see-plans"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-auto"
            >
              See Plans & Start
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={handleOpenPortal}
            data-testid="button-owner-portal"
            className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-auto backdrop-blur-sm bg-background/30"
          >
            Owner Portal
          </Button>
        </div>
        
        <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground px-2">
          KAPA-Based • 1000+ Flights Managed • Available 24/7
        </div>
      </div>
    </div>
  );
}
