import { Button } from "@/components/ui/button";
import { CheckCircle2, Plane, CreditCard, Bell } from "lucide-react";

interface WelcomeStepProps {
  onContinue: () => void;
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Welcome to Freedom Aviation!</h2>
        <p className="text-muted-foreground text-lg">
          We're excited to have you join our community of aircraft owners.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-lg">What to expect:</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Personal Information</p>
              <p className="text-sm text-muted-foreground">Tell us about yourself so we can serve you better</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Plane className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Aircraft Details</p>
              <p className="text-sm text-muted-foreground">Share your aircraft information and flying habits</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Choose Your Membership</p>
              <p className="text-sm text-muted-foreground">Select the service tier that fits your needs</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Set Up Payment</p>
              <p className="text-sm text-muted-foreground">Securely connect your payment method</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        This will take about 5 minutes. You can save your progress and return anytime.
      </div>

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onContinue} className="px-8">
          Let's Get Started
        </Button>
      </div>
    </div>
  );
}

