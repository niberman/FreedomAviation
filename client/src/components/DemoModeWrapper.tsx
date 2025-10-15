import { ReactNode, useEffect } from "react";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { DemoBanner } from "@/components/DemoBanner";
import { useToast } from "@/hooks/use-toast";

interface DemoModeWrapperProps {
  children: ReactNode;
}

export function DemoModeWrapper({ children }: DemoModeWrapperProps) {
  const { isDemo } = useDemoMode();
  const { toast } = useToast();

  useEffect(() => {
    if (isDemo) {
      // Intercept all form submissions in demo mode
      const handleFormSubmit = (e: Event) => {
        const target = e.target as HTMLFormElement;
        // Only prevent if it's going to Supabase or our API
        if (target.action && !target.action.includes('formsubmit.co')) {
          e.preventDefault();
          toast({
            title: "Demo Mode",
            description: "Actions are disabled in demo mode",
            variant: "default",
          });
        }
      };

      document.addEventListener('submit', handleFormSubmit, true);
      return () => document.removeEventListener('submit', handleFormSubmit, true);
    }
  }, [isDemo, toast]);

  if (!isDemo) {
    return <>{children}</>;
  }

  return (
    <div>
      <DemoBanner />
      {children}
    </div>
  );
}
