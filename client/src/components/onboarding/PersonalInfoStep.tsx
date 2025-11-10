import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonalInfo } from "@/types/onboarding";
import { Loader2, User } from "lucide-react";

interface PersonalInfoStepProps {
  initialData?: PersonalInfo;
  onComplete: (data: PersonalInfo) => void;
  onBack: () => void;
  saving: boolean;
}

export function PersonalInfoStep({ initialData, onComplete, onBack, saving }: PersonalInfoStepProps) {
  const [formData, setFormData] = useState<PersonalInfo>(initialData || {
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PersonalInfo, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PersonalInfo, string>> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete(formData);
    }
  };

  const updateField = (field: keyof PersonalInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <User className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Tell Us About You</h2>
        <p className="text-muted-foreground">
          This information helps us personalize your experience and communicate with you.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => updateField('full_name', e.target.value)}
            placeholder="John Doe"
            className={errors.full_name ? 'border-destructive' : ''}
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="(970) 555-0123"
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address (Optional)</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="123 Aviation Way"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="city">City (Optional)</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Denver"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State (Optional)</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => updateField('state', e.target.value)}
              placeholder="CO"
              maxLength={2}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code (Optional)</Label>
          <Input
            id="zip"
            value={formData.zip}
            onChange={(e) => updateField('zip', e.target.value)}
            placeholder="80112"
            maxLength={10}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </form>
  );
}

