import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Plus, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  PRICING_TIERS,
  HOURS_BANDS,
  CORE_FEATURES,
  AVAILABLE_ADDONS,
  calculateMonthlyPrice,
  calculateTotalWithAddons,
  getApplicableAddons,
  getPricingSummary,
  type PricingTier,
  type HoursRange,
} from '@/lib/unified-pricing';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UnifiedPricingCalculatorProps {
  /**
   * Initial tier selection
   */
  defaultTier?: PricingTier;
  /**
   * Initial hours range selection
   */
  defaultHours?: HoursRange;
  /**
   * Show compact version without features list
   */
  compact?: boolean;
  /**
   * Show addons section
   */
  showAddons?: boolean;
  /**
   * Callback when quote is generated (for dialogs/modals)
   */
  onQuoteGenerated?: () => void;
  /**
   * Custom CTA button text
   */
  ctaText?: string;
}

export function UnifiedPricingCalculator({
  defaultTier = 'performance',
  defaultHours = '20-50',
  compact = false,
  showAddons = true,
  onQuoteGenerated,
  ctaText = 'Get This Quote',
}: UnifiedPricingCalculatorProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedTier, setSelectedTier] = useState<PricingTier>(defaultTier);
  const [selectedHours, setSelectedHours] = useState<HoursRange>(defaultHours);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedTierData = PRICING_TIERS.find(t => t.id === selectedTier)!;
  const selectedHoursData = HOURS_BANDS.find(h => h.range === selectedHours)!;
  const basePrice = calculateMonthlyPrice(selectedTier, selectedHours);
  const applicableAddons = getApplicableAddons(selectedTier);
  const totalPrice = calculateTotalWithAddons(selectedTier, selectedHours, selectedAddons, 0);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleGetQuote = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const summary = getPricingSummary(selectedTier, selectedHours, selectedAddons);
      
      if (userData?.user) {
        // User is logged in - save the quote
        await supabase.from('support_tickets').insert([{
          owner_id: userData.user.id,
          subject: 'Pricing Quote Request',
          body: JSON.stringify({
            tier: selectedTierData.name,
            tier_id: selectedTier,
            hours_range: selectedHours,
            base_price: basePrice,
            addons: selectedAddons,
            total_price: totalPrice,
            summary: summary,
            timestamp: new Date().toISOString(),
          }),
          status: 'open',
        }]);
        
        toast({ 
          title: 'Quote Saved!', 
          description: "We'll contact you within 24 hours." 
        });
        
        onQuoteGenerated?.();
      } else {
        // User not logged in - save quote to sessionStorage and redirect to signup
        const quoteData = {
          tier: selectedTierData.name,
          tier_id: selectedTier,
          hours_range: selectedHours,
          base_price: basePrice,
          addons: selectedAddons,
          total_price: totalPrice,
          timestamp: new Date().toISOString(),
        };
        
        sessionStorage.setItem('pendingQuote', JSON.stringify(quoteData));
        
        toast({ 
          title: 'Create Account to Continue', 
          description: 'Sign up to save your quote and get started.' 
        });
        
        // Close dialog if provided
        onQuoteGenerated?.();
        
        // Redirect to signup after a brief delay
        setTimeout(() => {
          navigate('/login?action=register&from=quote');
        }, 800);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-2">
        <CardContent className="p-8">
          {/* Aircraft Tier Selection */}
          <div className="mb-8">
            <Label className="text-lg font-semibold mb-4 block">
              1. Select Your Aircraft Type
            </Label>
            <div className="grid md:grid-cols-3 gap-3">
              {PRICING_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => {
                    setSelectedTier(tier.id);
                    // Reset addons when tier changes as some may not be applicable
                    setSelectedAddons(prev => 
                      prev.filter(addonId => {
                        const addon = AVAILABLE_ADDONS.find(a => a.id === addonId);
                        return !addon?.applicableTiers || addon.applicableTiers.includes(tier.id);
                      })
                    );
                  }}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedTier === tier.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold mb-1">{tier.name}</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {tier.examples.join(', ')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    From ${tier.baseMonthly.toLocaleString()}/mo
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Hours Selection */}
          <div className="mb-8">
            <Label className="text-lg font-semibold mb-4 block">
              2. Monthly Flight Hours
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {HOURS_BANDS.map((band) => {
                const price = calculateMonthlyPrice(selectedTier, band.range);
                return (
                  <button
                    key={band.range}
                    onClick={() => setSelectedHours(band.range)}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      selectedHours === band.range
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold mb-1">{band.label}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {band.detailsPerMonth} detail{band.detailsPerMonth !== '1' ? 's' : ''}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      ${price.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Addons */}
          {showAddons && applicableAddons.length > 0 && (
            <div className="mb-8 pb-8 border-b">
              <Label className="text-lg font-semibold mb-4 block">
                3. Optional Enhancements (Optional)
              </Label>
              <div className="grid md:grid-cols-2 gap-4">
                {applicableAddons.map((addon) => (
                  <div
                    key={addon.id}
                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                      selectedAddons.includes(addon.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => toggleAddon(addon.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedAddons.includes(addon.id)}
                        onCheckedChange={() => toggleAddon(addon.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{addon.name}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs">
                                  <p className="font-semibold mb-2">{addon.name}</p>
                                  <ul className="text-sm space-y-1">
                                    {addon.features.map((feature, i) => (
                                      <li key={i}>• {feature}</li>
                                    ))}
                                  </ul>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {addon.description}
                        </p>
                        <div className="text-sm font-semibold text-primary">
                          +${addon.monthlyPrice.toLocaleString()}/mo
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result Card */}
          <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="text-sm opacity-90 mb-1">Your Monthly Price</div>
                <div className="text-5xl font-bold mb-2">
                  ${totalPrice.toLocaleString()}
                  <span className="text-2xl">/mo</span>
                </div>
                <div className="text-sm opacity-90 mb-3">
                  {selectedTierData.name} • {selectedHoursData.label}
                </div>
                
                {/* Price Breakdown */}
                <div className="text-xs opacity-75 space-y-1">
                  <div>Base service: ${basePrice.toLocaleString()}/mo</div>
                  {selectedAddons.length > 0 && (
                    <div>
                      {selectedAddons.map(addonId => {
                        const addon = AVAILABLE_ADDONS.find(a => a.id === addonId);
                        return addon ? (
                          <div key={addonId}>
                            + {addon.name}: ${addon.monthlyPrice.toLocaleString()}/mo
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div className="pt-1 mt-1 border-t border-primary-foreground/20">
                    {selectedHoursData.serviceFrequency}
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={handleGetQuote}
                disabled={saving}
                className="w-full md:w-auto text-lg px-8 py-6 h-auto"
              >
                {saving ? 'Saving...' : ctaText}
              </Button>
            </div>
          </div>

          {/* What's Included */}
          {!compact && (
            <div className="pt-8 border-t">
              <h3 className="font-semibold mb-4">What's Included in Base Service</h3>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                {CORE_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{feature.name}</span>
                      {feature.description && (
                        <span className="text-muted-foreground"> — {feature.description}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Tier-specific premium features */}
              {selectedTierData.premiumFeatures && selectedTierData.premiumFeatures.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3 text-sm text-primary">
                    {selectedTierData.name} Premium Features
                  </h4>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                    {selectedTierData.premiumFeatures.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Plus className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">{feature.name}</span>
                          {feature.description && (
                            <span className="text-muted-foreground"> — {feature.description}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
