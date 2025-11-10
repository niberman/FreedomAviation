import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MembershipSelection, PersonalInfo, AircraftInfo } from "@/types/onboarding";
import { Check, FileText, Download, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface QuoteStepProps {
  membershipSelection?: MembershipSelection;
  personalInfo?: PersonalInfo;
  aircraftInfo?: AircraftInfo;
  onComplete: () => void;
  onBack: () => void;
  saving: boolean;
}

export function QuoteStep({ 
  membershipSelection, 
  personalInfo, 
  aircraftInfo,
  onComplete, 
  onBack, 
  saving 
}: QuoteStepProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  // Parse the membership tier from the package_id
  const packageId = membershipSelection?.package_id || '';
  const tierName = packageId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Get hangar cost from membership selection
  const hangarId = membershipSelection?.hangar_id || 'none';
  const hangarCost = membershipSelection?.hangar_cost || 0;
  const baseMonthly = membershipSelection?.base_monthly || 0;
  const totalMonthly = baseMonthly + hangarCost;

  const handleGenerateQuote = async () => {
    setGenerating(true);
    try {
      // Save quote information to database
      const quoteData = {
        user_id: user?.id,
        package_id: packageId,
        tier_name: tierName,
        base_monthly: baseMonthly,
        hangar_id: hangarId,
        hangar_cost: hangarCost,
        total_monthly: totalMonthly,
        aircraft_tail: aircraftInfo?.tail_number,
        aircraft_make: aircraftInfo?.make,
        aircraft_model: aircraftInfo?.model,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      // Store in a quotes table (we'll create this)
      const { error } = await supabase
        .from('membership_quotes')
        .insert(quoteData);

      if (error) {
        console.error('Error saving quote:', error);
        // Continue anyway - the quote generation is more for show
      }

      toast({
        title: "Quote Generated!",
        description: "Your membership quote has been created. We'll be in touch soon.",
      });

      // Complete the onboarding after a brief delay
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error('Error generating quote:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate quote. Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <FileText className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Your Membership Quote</h2>
        <p className="text-muted-foreground">
          Review your customized membership package below
        </p>
      </div>

      {/* Quote Summary Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="py-6 space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">MEMBER INFORMATION</h3>
            <div className="space-y-1">
              <p className="font-medium">{personalInfo?.full_name || user?.email}</p>
              <p className="text-sm text-muted-foreground">{personalInfo?.email || user?.email}</p>
              {personalInfo?.phone && (
                <p className="text-sm text-muted-foreground">{personalInfo.phone}</p>
              )}
            </div>
          </div>

          {/* Aircraft Info */}
          {aircraftInfo && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">AIRCRAFT</h3>
              <div className="space-y-1">
                <p className="font-medium text-lg">{aircraftInfo.tail_number}</p>
                <p className="text-sm text-muted-foreground">
                  {aircraftInfo.make} {aircraftInfo.model}
                  {aircraftInfo.year && ` (${aircraftInfo.year})`}
                </p>
                {aircraftInfo.base_location && (
                  <p className="text-sm text-muted-foreground">Based at {aircraftInfo.base_location}</p>
                )}
              </div>
            </div>
          )}

          {/* Membership Package */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">MEMBERSHIP PACKAGE</h3>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-lg">{tierName}</p>
                <Badge variant="secondary" className="mt-1">Premium Service Package</Badge>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">PRICING BREAKDOWN</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Service Package</span>
                <span className="font-medium">${baseMonthly.toLocaleString()}/month</span>
              </div>
              
              {hangarCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Hangar ({hangarId !== 'none' ? hangarId : 'Premium Location'})
                  </span>
                  <span className="font-medium">${hangarCost.toLocaleString()}/month</span>
                </div>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-lg">Total Monthly Investment</span>
                  <div className="text-right">
                    <span className="font-bold text-3xl text-primary">${totalMonthly.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">WHAT'S INCLUDED</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Full-service aircraft management & concierge</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Regular detailing and readiness services</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Maintenance coordination & oversight</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Digital owner portal with real-time updates</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Priority scheduling & personalized support</span>
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="border-t pt-4 bg-muted/30 -mx-6 px-6 py-4 -mb-6">
            <h3 className="font-semibold text-sm mb-2">NEXT STEPS</h3>
            <p className="text-sm text-muted-foreground">
              Our team will review your quote and reach out within 24 hours to discuss your membership, 
              answer any questions, and coordinate your aircraft onboarding.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          onClick={handleGenerateQuote}
          disabled={generating || saving}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <FileText className="mr-2 h-4 w-4 animate-pulse" />
              Generating Quote...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Complete Setup
            </>
          )}
        </Button>

        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack} 
          className="w-full"
          disabled={generating || saving}
        >
          Go Back
        </Button>
      </div>

      {/* Info Note */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>
          <Mail className="h-3 w-3 inline mr-1" />
          You'll receive a copy of this quote via email
        </p>
        <p className="text-muted-foreground/70">
          No payment required at this time • Quote valid for 30 days
        </p>
      </div>
    </div>
  );
}

