import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MembershipSelection, PersonalInfo } from "@/types/onboarding";
import { PRICING_TIERS, calculateMonthlyPrice, type PricingTier, type HoursRange } from "@/lib/unified-pricing";
import { Loader2, CreditCard, Lock, AlertCircle } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentStepProps {
  membershipSelection?: MembershipSelection;
  personalInfo?: PersonalInfo;
  onComplete: (stripeCustomerId: string, stripeSubscriptionId: string) => void;
  onBack: () => void;
  saving: boolean;
}

function PaymentForm({ 
  membershipSelection, 
  personalInfo, 
  onComplete, 
  clientSecret 
}: {
  membershipSelection?: MembershipSelection;
  personalInfo?: PersonalInfo;
  onComplete: (stripeCustomerId: string, stripeSubscriptionId: string) => void;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/onboarding?step=complete`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // Get customer and subscription IDs from backend
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const response = await fetch('/api/onboarding/stripe-info', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to retrieve subscription info');
        }

        const { customerId, subscriptionId } = await response.json();
        onComplete(customerId, subscriptionId);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        disabled={!stripe || processing} 
        className="w-full"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Complete Setup
          </>
        )}
      </Button>

      <div className="text-center text-xs text-muted-foreground">
        <Lock className="h-3 w-3 inline mr-1" />
        Secured by Stripe • Your payment information is encrypted and secure
      </div>
    </form>
  );
}

export function PaymentStep({ membershipSelection, personalInfo, onComplete, onBack, saving }: PaymentStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const selectedTier = PRICING_TIERS.find(t => t.id === membershipSelection?.package_id);
  const monthlyPrice = membershipSelection?.package_id && membershipSelection?.hours_band
    ? calculateMonthlyPrice(membershipSelection.package_id as PricingTier, membershipSelection.hours_band as HoursRange)
    : 0;

  useEffect(() => {
    async function createPaymentIntent() {
      if (!user || !membershipSelection) return;

      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        
        const response = await fetch('/api/onboarding/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            membershipSelection,
            personalInfo,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create subscription');
        }

        const { clientSecret: secret } = await response.json();
        setClientSecret(secret);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Failed to initialize payment. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    createPaymentIntent();
  }, [user, membershipSelection, personalInfo]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={onBack} className="w-full">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Set Up Payment</h2>
        <p className="text-muted-foreground">
          Complete your membership setup with secure payment.
        </p>
      </div>

      {/* Order Summary */}
      <Card className="bg-muted/50">
        <CardContent className="py-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{selectedTier?.title}</p>
              <p className="text-sm text-muted-foreground">
                {membershipSelection?.hours_band} hours per month
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl">${monthlyPrice}</p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Billing Frequency</span>
              <span className="font-medium">Monthly</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">First Payment</span>
              <span className="font-medium">${monthlyPrice}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            membershipSelection={membershipSelection}
            personalInfo={personalInfo}
            onComplete={onComplete}
            clientSecret={clientSecret}
          />
        </Elements>
      )}

      <div className="text-center">
        <Button type="button" variant="ghost" onClick={onBack} size="sm">
          Go Back
        </Button>
      </div>
    </div>
  );
}

