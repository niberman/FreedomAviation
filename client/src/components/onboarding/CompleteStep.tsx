import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PersonalInfo } from "@/types/onboarding";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface CompleteStepProps {
  onComplete: () => void;
  personalInfo?: PersonalInfo;
}

export function CompleteStep({ onComplete, personalInfo }: CompleteStepProps) {
  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="space-y-6 text-center py-8">
      <div className="flex justify-center">
        <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
          <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Welcome Aboard{personalInfo?.full_name ? `, ${personalInfo.full_name.split(' ')[0]}` : ''}!</h2>
        <p className="text-lg text-muted-foreground">
          Your quote has been submitted and we'll be in touch within 24 hours.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-6 space-y-4 text-left max-w-md mx-auto">
        <h3 className="font-semibold text-center">What's Next?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Check Your Email</p>
              <p className="text-sm text-muted-foreground">
                You'll receive a copy of your quote and next steps
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Explore Your Dashboard</p>
              <p className="text-sm text-muted-foreground">
                View your aircraft and personalize your profile
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">We'll Contact You Soon</p>
              <p className="text-sm text-muted-foreground">
                Our team will reach out to finalize your membership details
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Redirecting to your dashboard in a few seconds...
      </div>

      <Button size="lg" onClick={onComplete} className="mt-4">
        Go to Dashboard
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

