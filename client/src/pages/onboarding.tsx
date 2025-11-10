import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import logoImage from "@assets/falogo.png";
import { OnboardingData, OnboardingStep, PersonalInfo, AircraftInfo, MembershipSelection } from "@/types/onboarding";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { PersonalInfoStep } from "@/components/onboarding/PersonalInfoStep";
import { AircraftInfoStep } from "@/components/onboarding/AircraftInfoStep";
import { MembershipStep } from "@/components/onboarding/MembershipStep";
import { PaymentStep } from "@/components/onboarding/PaymentStep";
import { CompleteStep } from "@/components/onboarding/CompleteStep";
import { supabase } from "@/lib/supabase";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    step: 'welcome',
    completed: false,
  });

  const steps: OnboardingStep[] = ['welcome', 'personal-info', 'aircraft-info', 'membership', 'payment', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Load existing onboarding data
  useEffect(() => {
    async function loadOnboardingData() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('onboarding_data')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading onboarding data:', error);
        }

        if (data) {
          setOnboardingData(data);
          setCurrentStep(data.completed ? 'complete' : data.step);
        }
      } catch (err) {
        console.error('Error loading onboarding:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOnboardingData();
  }, [user]);

  // Save onboarding data
  const saveOnboardingData = async (data: Partial<OnboardingData>) => {
    if (!user) return;

    setSaving(true);
    try {
      const updatedData = { ...onboardingData, ...data, user_id: user.id };
      
      const { error } = await supabase
        .from('onboarding_data')
        .upsert(updatedData, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      setOnboardingData(updatedData);
    } catch (err: any) {
      console.error('Error saving onboarding data:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to save progress",
      });
    } finally {
      setSaving(false);
    }
  };

  // Navigation handlers
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex];
      setCurrentStep(nextStep);
      saveOnboardingData({ step: nextStep });
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = steps[prevIndex];
      setCurrentStep(prevStep);
      saveOnboardingData({ step: prevStep });
    }
  };

  // Step completion handlers
  const handlePersonalInfoComplete = async (data: PersonalInfo) => {
    await saveOnboardingData({ personal_info: data });
    
    // Also update user profile
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
        })
        .eq('id', user?.id);

      if (error) {
        console.error('Error updating user profile:', error);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
    
    goToNextStep();
  };

  const handleAircraftInfoComplete = async (data: AircraftInfo) => {
    await saveOnboardingData({ aircraft_info: data });
    
    // Create aircraft record
    try {
      const { error } = await supabase
        .from('aircraft')
        .insert({
          tail_number: data.tail_number,
          make: data.make,
          model: data.model,
          year: data.year,
          base_location: data.base_location,
          hobbs_hours: data.hobbs_hours,
          tach_hours: data.tach_hours,
          owner_id: user?.id,
        });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error creating aircraft:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save aircraft information",
        });
        return;
      }
    } catch (err) {
      console.error('Error creating aircraft:', err);
    }
    
    goToNextStep();
  };

  const handleMembershipComplete = async (data: MembershipSelection) => {
    await saveOnboardingData({ membership_selection: data });
    goToNextStep();
  };

  const handlePaymentComplete = async (stripeCustomerId: string, stripeSubscriptionId: string) => {
    await saveOnboardingData({
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
    });
    goToNextStep();
  };

  const handleCompleteOnboarding = async () => {
    await saveOnboardingData({ completed: true, step: 'complete' });
    
    // Send welcome email
    try {
      const response = await fetch('/api/onboarding/welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (!response.ok) {
        console.error('Failed to send welcome email');
      }
    } catch (err) {
      console.error('Error sending welcome email:', err);
    }
    
    // Redirect to dashboard
    setTimeout(() => {
      setLocation('/dashboard');
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Freedom Aviation" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold">Welcome to Freedom Aviation</h1>
                <p className="text-sm text-muted-foreground">Let's get you set up</p>
              </div>
            </div>
            {currentStep !== 'complete' && (
              <div className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {currentStep !== 'complete' && (
        <div className="border-b bg-background/50">
          <div className="container mx-auto px-4 py-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="pt-6">
            {currentStep === 'welcome' && (
              <WelcomeStep onContinue={goToNextStep} />
            )}
            
            {currentStep === 'personal-info' && (
              <PersonalInfoStep
                initialData={onboardingData.personal_info}
                onComplete={handlePersonalInfoComplete}
                onBack={goToPreviousStep}
                saving={saving}
              />
            )}
            
            {currentStep === 'aircraft-info' && (
              <AircraftInfoStep
                initialData={onboardingData.aircraft_info}
                onComplete={handleAircraftInfoComplete}
                onBack={goToPreviousStep}
                saving={saving}
              />
            )}
            
            {currentStep === 'membership' && (
              <MembershipStep
                initialData={onboardingData.membership_selection}
                aircraftInfo={onboardingData.aircraft_info}
                onComplete={handleMembershipComplete}
                onBack={goToPreviousStep}
                saving={saving}
              />
            )}
            
            {currentStep === 'payment' && (
              <PaymentStep
                membershipSelection={onboardingData.membership_selection}
                personalInfo={onboardingData.personal_info}
                onComplete={handlePaymentComplete}
                onBack={goToPreviousStep}
                saving={saving}
              />
            )}
            
            {currentStep === 'complete' && (
              <CompleteStep
                onComplete={handleCompleteOnboarding}
                personalInfo={onboardingData.personal_info}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

