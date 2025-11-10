import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, CreditCard, Shield, Info } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding";

interface OnboardingPaymentStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export function OnboardingPaymentStep({ data, updateData, onNext }: OnboardingPaymentStepProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  // Check for payment success/cancel in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const sessionId = params.get("session_id");
    
    if (paymentStatus === "success" && sessionId) {
      handlePaymentSuccess(sessionId);
    } else if (paymentStatus === "cancelled") {
      toast({
        variant: "destructive",
        title: "Payment cancelled",
        description: "You can try again when you're ready.",
      });
    }
  }, []);
  
  const handlePaymentSuccess = async (sessionId: string) => {
    setCheckingPayment(true);
    try {
      // Verify payment with backend
      const response = await fetch("/api/stripe/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });
      
      if (response.ok) {
        updateData({ 
          stripeSessionId: sessionId,
          paymentComplete: true 
        });
        
        // Activate membership
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("memberships")
            .update({ is_active: true })
            .eq("owner_id", user.id)
            .eq("is_active", false);
        }
        
        toast({
          title: "Payment successful!",
          description: "Your membership is now active.",
        });
        
        // Proceed to completion
        setTimeout(() => onNext(), 1500);
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      setError("Failed to verify payment. Please contact support.");
    } finally {
      setCheckingPayment(false);
    }
  };
  
  const handleStartPayment = async () => {
    setLoading(true);
    setError("");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Create checkout session
      const response = await fetch("/api/stripe/create-membership-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          membershipTier: data.membershipTier,
          monthlyPrice: data.monthlyPrice,
          hangarLocation: data.hangarLocation,
          userEmail: data.email,
          userName: data.fullName,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }
      
      const { checkoutUrl } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  if (checkingPayment) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verifying your payment...</p>
      </div>
    );
  }
  
  if (data.paymentComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h3 className="text-xl font-semibold">Payment Complete!</h3>
        <p className="text-muted-foreground">Your membership is now active.</p>
      </div>
    );
  }
  
  // Get tier display name
  const tierDisplayName = 
    data.membershipTier === "class-i" ? "Class I" :
    data.membershipTier === "class-ii" ? "Class II" :
    data.membershipTier === "class-iii" ? "Class III" : "Membership";
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Review your membership details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Membership Details */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{tierDisplayName} Membership</span>
              <Badge variant="secondary">Monthly</Badge>
            </div>
            {data.hangarLocation && data.hangarLocation !== "none" && (
              <div className="text-sm text-muted-foreground">
                + {data.hangarLocation} Hangar
              </div>
            )}
          </div>
          
          {/* Aircraft Details */}
          {data.tailNumber && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Aircraft</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{data.tailNumber} - {data.aircraftMake} {data.aircraftModel}</p>
                {data.baseAirport && <p>Based at {data.baseAirport}</p>}
              </div>
            </div>
          )}
          
          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Monthly Total</span>
              <span>${data.monthlyPrice}/mo</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your payment is processed securely through Stripe. We never store your card details.
        </AlertDescription>
      </Alert>
      
      {/* Billing Info */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          You'll be charged ${data.monthlyPrice} today and on the same day each month.
        </p>
        <p>You can cancel or modify your membership anytime from your dashboard.</p>
      </div>
      
      {/* Payment Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleStartPayment}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Starting secure checkout...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Complete Payment with Stripe
          </>
        )}
      </Button>
      
      {/* Test Mode Notice - Remove in production */}
      {process.env.NODE_ENV === "development" && (
        <Alert variant="default" className="bg-blue-50 dark:bg-blue-950">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with any future expiry date and CVC.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
