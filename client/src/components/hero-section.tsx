import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";
import heroImage from "@assets/stock_images/premium_cirrus_sr22t_b2f4f8b8.jpg";

export function HeroSection() {
  const handleOpenPortal = () => {
    console.log("Open Owner Portal clicked");
    // TODO: remove mock functionality - navigate to /login
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Plane className="h-8 w-8 text-primary" />
          <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Freedom Aviation
          </span>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 text-foreground">
          Just Fly. We Handle<br />Everything.
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Premium aircraft management and expert flight instruction for owner-pilots at Centennial Airport.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            onClick={handleOpenPortal}
            data-testid="button-open-portal"
            className="text-lg px-8"
          >
            Open Owner Portal
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => console.log("Learn more clicked")}
            data-testid="button-learn-more"
            className="text-lg px-8 backdrop-blur-sm bg-background/30"
          >
            Learn More
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground">
          KAPA-Based • 1000+ Flights Managed • Available 24/7
        </div>
      </div>
    </div>
  );
}
