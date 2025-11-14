import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Check, Plus, Info, ArrowRight, Sparkles, Building2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useLocations } from '@/features/pricing/hooks';
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
  const { data: locations = [] } = useLocations();
  const [selectedTier, setSelectedTier] = useState<PricingTier>(defaultTier);
  const [selectedHours, setSelectedHours] = useState<HoursRange>(defaultHours);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');
  const [saving, setSaving] = useState(false);

  // Auto-select first location when loaded
  if (locations.length > 0 && !selectedLocationId) {
    setSelectedLocationId(locations[0].id);
  }

  const selectedTierData = PRICING_TIERS.find(t => t.id === selectedTier)!;
  const selectedHoursData = HOURS_BANDS.find(h => h.range === selectedHours)!;
  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const hangarCost = selectedLocation?.hangar_cost_monthly || 0;
  const basePrice = calculateMonthlyPrice(selectedTier, selectedHours);
  const applicableAddons = getApplicableAddons(selectedTier);
  const totalPrice = calculateTotalWithAddons(selectedTier, selectedHours, selectedAddons, hangarCost);

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
            hangar_location: selectedLocation?.name || 'Not selected',
            hangar_cost: hangarCost,
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
          hangar_location: selectedLocation?.name || 'Not selected',
          hangar_cost: hangarCost,
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
    <div className="max-w-5xl mx-auto">
      <Card className="border-2 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Step Indicator */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6 border-b">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                <span className="font-medium text-sm">Aircraft Type</span>
              </div>
              <div className="flex-1 h-px bg-border mx-4" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                <span className="font-medium text-sm">Usage Level</span>
              </div>
              <div className="flex-1 h-px bg-border mx-4" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                <span className="font-medium text-sm hidden sm:inline">Add-ons</span>
                <span className="font-medium text-sm sm:hidden">+</span>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            {/* Hangar Location Selector - Top of Calculator */}
            <div className="mb-8 pb-8 border-b">
              <Label className="text-lg font-bold mb-4 block">Select Your Hangar Location</Label>
              <div className="flex flex-wrap gap-3">
                {locations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocationId(location.id)}
                    className={`px-4 py-2 border-2 rounded-lg transition-all flex items-center gap-2 ${
                      selectedLocationId === location.id
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Building2 className={`h-4 w-4 ${selectedLocationId === location.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{location.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        +${location.hangar_cost_monthly.toLocaleString()}/mo
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Hangar cost is included in the prices below
              </p>
            </div>

            {/* Aircraft Tier Selection */}
            <div className="mb-10">
              <Label className="text-xl font-bold mb-6 block flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</div>
                Choose Your Aircraft Type
              </Label>
              <div className="grid md:grid-cols-3 gap-4">
                {PRICING_TIERS.map((tier) => {
                  const priceWithHangar = tier.baseMonthly + hangarCost;
                  return (
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
                      className={`group p-5 border-2 rounded-xl text-left transition-all hover:scale-105 ${
                        selectedTier === tier.id
                          ? 'border-primary bg-primary/10 shadow-lg scale-105'
                          : 'border-border hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${selectedTier === tier.id ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        <div className="font-bold text-lg">{tier.name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {tier.examples.join(', ')}
                      </div>
                      <div className="text-sm font-semibold text-primary">
                        From ${priceWithHangar.toLocaleString()}/mo
                      </div>
                      {hangarCost > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Includes hangar
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hours Selection */}
            <div className="mb-10">
              <Label className="text-xl font-bold mb-6 block flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</div>
                Select Monthly Usage
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {HOURS_BANDS.map((band) => {
                  const price = calculateMonthlyPrice(selectedTier, band.range) + hangarCost;
                  return (
                    <button
                      key={band.range}
                      onClick={() => setSelectedHours(band.range)}
                      className={`group p-6 border-2 rounded-xl text-center transition-all hover:scale-105 ${
                        selectedHours === band.range
                          ? 'border-primary bg-primary/10 shadow-lg scale-105'
                          : 'border-border hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${selectedHours === band.range ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        <div className="font-bold text-lg">{band.label}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        {band.detailsPerMonth} detail{band.detailsPerMonth !== '1' ? 's' : ''} • {band.serviceFrequency}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        ${price.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">/month</div>
                      {hangarCost > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Includes hangar
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Addons */}
            {showAddons && applicableAddons.length > 0 && (
              <div className="mb-10">
                <Label className="text-xl font-bold mb-6 block flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</div>
                  Add Optional Enhancements
                </Label>
                <div className="grid md:grid-cols-2 gap-4">
                  {applicableAddons.map((addon) => (
                    <div
                      key={addon.id}
                      className={`group p-5 border-2 rounded-xl transition-all cursor-pointer ${
                        selectedAddons.includes(addon.id)
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border hover:border-primary/30 hover:shadow-md'
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
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold">{addon.name}</span>
                            <div className="text-sm font-bold text-primary whitespace-nowrap">
                              +${addon.monthlyPrice.toLocaleString()}/mo
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            {addon.description}
                          </p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs hover:bg-transparent">
                                  <Info className="h-3 w-3 mr-1" />
                                  View details
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div>
                                  <p className="font-semibold mb-2">{addon.name}</p>
                                  <ul className="text-sm space-y-1">
                                    {addon.features.map((feature, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result Card - Prominent */}
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80 rounded-2xl blur-sm" />
              
              <div className="relative bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl p-8 md:p-10 shadow-2xl">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                  <div className="flex-1">
                      <Badge className="mb-3 bg-white/20 text-white hover:bg-white/30 border-white/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Your Custom Quote
                    </Badge>
                    
                    <div className="text-sm opacity-90 mb-2">Total Monthly Investment</div>
                    <div className="flex items-baseline gap-3 mb-4">
                      <div className="text-6xl md:text-7xl font-bold">
                        ${totalPrice.toLocaleString()}
                      </div>
                      <div className="text-2xl opacity-90">/month</div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {selectedTierData.name}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {selectedHoursData.label}
                      </Badge>
                      {selectedLocation && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                          <Building2 className="h-3 w-3 mr-1" />
                          {selectedLocation.name}
                        </Badge>
                      )}
                      {selectedAddons.length > 0 && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                          +{selectedAddons.length} Enhancement{selectedAddons.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Price Breakdown */}
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <div className="text-xs font-semibold opacity-90 mb-2">Price Breakdown</div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="opacity-90">{selectedTierData.name} + {selectedHoursData.label}</span>
                          <span className="font-semibold">${(basePrice + hangarCost).toLocaleString()}</span>
                        </div>
                        {hangarCost > 0 && (
                          <div className="text-xs opacity-75 pl-2">
                            ↳ Includes hangar at {selectedLocation?.name}
                          </div>
                        )}
                        {selectedAddons.map(addonId => {
                          const addon = AVAILABLE_ADDONS.find(a => a.id === addonId);
                          return addon ? (
                            <div key={addonId} className="flex justify-between items-center">
                              <span className="opacity-90">+ {addon.name}</span>
                              <span className="font-semibold">${addon.monthlyPrice.toLocaleString()}</span>
                            </div>
                          ) : null;
                        })}
                        <div className="pt-2 mt-2 border-t border-white/20 text-xs opacity-75">
                          Includes: {selectedHoursData.serviceFrequency.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full lg:w-auto flex flex-col gap-3">
                    <Button 
                      size="lg" 
                      variant="secondary"
                      onClick={handleGetQuote}
                      disabled={saving}
                      className="text-lg px-10 py-7 h-auto shadow-xl hover:shadow-2xl transition-shadow font-bold"
                    >
                      {saving ? 'Processing...' : ctaText}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <p className="text-xs text-center text-white/70">
                      No credit card required • Instant quote
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Included - Compact */}
            {!compact && (
              <div className="mt-10 pt-10 border-t">
                <h3 className="text-lg font-bold mb-6 text-center">✓ Everything Included in Your Plan</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {CORE_FEATURES.slice(0, 6).map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg bg-muted/30">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="font-medium">{feature.name}</div>
                    </div>
                  ))}
                </div>
                
                {/* Tier-specific premium features */}
                {selectedTierData.premiumFeatures && selectedTierData.premiumFeatures.length > 0 && (
                  <div className="mt-6">
                    <div className="text-center mb-4">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Plus className="h-3 w-3 mr-1" />
                        {selectedTierData.name} Premium Includes
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {selectedTierData.premiumFeatures.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold">{feature.name}</div>
                            {feature.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">{feature.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
