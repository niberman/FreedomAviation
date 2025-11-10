import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Simple 3-tier system
const AIRCRAFT_CLASSES = [
  {
    id: 'light',
    name: 'Light Aircraft',
    examples: 'C172, C182, Archer',
    basePrice: 850,
  },
  {
    id: 'performance',
    name: 'High Performance',
    examples: 'SR22, Mooney, Bonanza',
    basePrice: 1650,
  },
  {
    id: 'turbine',
    name: 'Turbine',
    examples: 'TBM, Vision Jet',
    basePrice: 3200,
  },
];

const HOURS = [
  { value: 10, label: '0-20 hrs', multiplier: 1.0 },
  { value: 35, label: '20-50 hrs', multiplier: 1.45 },
  { value: 60, label: '50+ hrs', multiplier: 1.9 },
];

const INCLUDED = [
  'Hangar at Centennial (KAPA)',
  'Pre & post-flight prep',
  'Cleaning & detailing',
  'Fluid top-offs (oil, O₂, TKS)',
  'Owner portal access',
  'Maintenance coordination',
];

interface SimplePricingCalculatorProps {
  onQuoteGenerated?: () => void;
}

export function SimplePricingCalculator({ onQuoteGenerated }: SimplePricingCalculatorProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedClass, setSelectedClass] = useState('performance');
  const [selectedHours, setSelectedHours] = useState(35);
  const [saving, setSaving] = useState(false);

  const aircraftClass = AIRCRAFT_CLASSES.find(c => c.id === selectedClass)!;
  const hourConfig = HOURS.find(h => h.value === selectedHours)!;
  const monthlyPrice = Math.round(aircraftClass.basePrice * hourConfig.multiplier);

  const handleGetQuote = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        // User is logged in - save the quote
        await supabase.from("support_tickets").insert([{
          owner_id: userData.user.id,
          subject: "Pricing Quote Request",
          body: JSON.stringify({
            aircraft_class: aircraftClass.name,
            monthly_hours: selectedHours,
            monthly_price: monthlyPrice,
          }),
          status: "open",
        }]);
        
        toast({ 
          title: "Quote Saved!", 
          description: "We'll contact you within 24 hours." 
        });
        
        onQuoteGenerated?.();
      } else {
        // User not logged in - save quote to sessionStorage and redirect to signup
        const quoteData = {
          aircraft_class: aircraftClass.name,
          aircraft_class_id: selectedClass,
          monthly_hours: selectedHours,
          monthly_price: monthlyPrice,
          timestamp: new Date().toISOString(),
        };
        
        sessionStorage.setItem('pendingQuote', JSON.stringify(quoteData));
        
        toast({ 
          title: "Create Account to Continue", 
          description: "Sign up to save your quote and get started." 
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
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-2">
        <CardContent className="p-8">
          {/* Aircraft Selection */}
          <div className="mb-8">
            <Label className="text-lg font-semibold mb-4 block">1. Select Your Aircraft Type</Label>
            <div className="grid md:grid-cols-3 gap-3">
              {AIRCRAFT_CLASSES.map((ac) => (
                <button
                  key={ac.id}
                  onClick={() => setSelectedClass(ac.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedClass === ac.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold mb-1">{ac.name}</div>
                  <div className="text-sm text-muted-foreground">{ac.examples}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hours Selection */}
          <div className="mb-8">
            <Label className="text-lg font-semibold mb-4 block">2. Monthly Flight Hours</Label>
            <div className="grid grid-cols-3 gap-3">
              {HOURS.map((hr) => (
                <button
                  key={hr.value}
                  onClick={() => setSelectedHours(hr.value)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    selectedHours === hr.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold">{hr.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-xl p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="text-sm opacity-90 mb-1">Your Monthly Price</div>
                <div className="text-5xl font-bold mb-2">
                  ${monthlyPrice.toLocaleString()}<span className="text-2xl">/mo</span>
                </div>
                <div className="text-sm opacity-90">
                  {aircraftClass.name} • {hourConfig.label}
                </div>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={handleGetQuote}
                disabled={saving}
                className="w-full md:w-auto text-lg px-8 py-6 h-auto"
              >
                {saving ? 'Saving...' : 'Get This Quote'}
              </Button>
            </div>
          </div>

          {/* What's Included */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="font-semibold mb-4">What's Included</h3>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
              {INCLUDED.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

