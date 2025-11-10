import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Plane, Calendar, Wrench, Phone } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding";
import confetti from "canvas-confetti";

interface OnboardingCompleteStepProps {
  data: OnboardingData;
}

export function OnboardingCompleteStep({ data }: OnboardingCompleteStepProps) {
  const [, setLocation] = useLocation();
  
  // Trigger confetti animation
  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Clear onboarding data from localStorage
    localStorage.removeItem("fa:onboarding");

    return () => clearInterval(interval);
  }, []);
  
  const handleGoToDashboard = () => {
    setLocation("/dashboard");
  };
  
  // Get tier display name
  const tierDisplayName = 
    data.membershipTier === "class-i" ? "Class I" :
    data.membershipTier === "class-ii" ? "Class II" :
    data.membershipTier === "class-iii" ? "Class III" : "";
  
  return (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
          <CheckCircle className="h-20 w-20 text-green-500 relative" />
        </div>
      </div>
      
      {/* Welcome Message */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Welcome to Freedom Aviation!</h2>
        <p className="text-xl text-muted-foreground">
          Your {tierDisplayName} membership is now active
        </p>
      </div>
      
      {/* Membership Details Card */}
      <Card className="text-left">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Aircraft</span>
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                <span className="font-medium">{data.tailNumber}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Membership</span>
              <Badge variant="default">{tierDisplayName}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly Rate</span>
              <span className="font-medium">${data.monthlyPrice}/mo</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* What's Next */}
      <div className="space-y-4 text-left">
        <h3 className="font-semibold text-lg">What happens next?</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Schedule your first service</p>
              <p className="text-sm text-muted-foreground">
                Access your dashboard to request maintenance or prep services
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Wrench className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Track maintenance</p>
              <p className="text-sm text-muted-foreground">
                We'll help you stay on top of all required maintenance items
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Phone className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">24/7 support</p>
              <p className="text-sm text-muted-foreground">
                {tierDisplayName === "Class III" 
                  ? "Your concierge team is ready to assist anytime"
                  : "Reach out whenever you need assistance"}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleGoToDashboard}
      >
        Go to Your Dashboard
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
