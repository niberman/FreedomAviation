import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AircraftInfo } from "@/types/onboarding";
import { Loader2, Plane } from "lucide-react";

interface AircraftInfoStepProps {
  initialData?: AircraftInfo;
  onComplete: (data: AircraftInfo) => void;
  onBack: () => void;
  saving: boolean;
}

export function AircraftInfoStep({ initialData, onComplete, onBack, saving }: AircraftInfoStepProps) {
  const [formData, setFormData] = useState<AircraftInfo>(initialData || {
    tail_number: '',
    make: '',
    model: '',
    year: undefined,
    base_location: 'KAPA',
    hobbs_hours: undefined,
    tach_hours: undefined,
    average_monthly_hours: undefined,
    primary_use: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AircraftInfo, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AircraftInfo, string>> = {};

    if (!formData.tail_number.trim()) {
      newErrors.tail_number = 'Tail number is required';
    } else if (!/^N\d{1,5}[A-Z]{0,2}$/i.test(formData.tail_number)) {
      newErrors.tail_number = 'Please enter a valid N-number (e.g., N12345)';
    }

    if (!formData.make.trim()) {
      newErrors.make = 'Aircraft make is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Aircraft model is required';
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

  const updateField = (field: keyof AircraftInfo, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <Plane className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Your Aircraft</h2>
        <p className="text-muted-foreground">
          Tell us about your aircraft so we can provide the best service.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tail_number">Tail Number (N-Number) *</Label>
          <Input
            id="tail_number"
            value={formData.tail_number}
            onChange={(e) => updateField('tail_number', e.target.value.toUpperCase())}
            placeholder="N12345"
            className={errors.tail_number ? 'border-destructive' : ''}
          />
          {errors.tail_number && (
            <p className="text-sm text-destructive">{errors.tail_number}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              value={formData.make}
              onChange={(e) => updateField('make', e.target.value)}
              placeholder="Cessna"
              className={errors.make ? 'border-destructive' : ''}
            />
            {errors.make && (
              <p className="text-sm text-destructive">{errors.make}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder="172"
              className={errors.model ? 'border-destructive' : ''}
            />
            {errors.model && (
              <p className="text-sm text-destructive">{errors.model}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year (Optional)</Label>
          <Input
            id="year"
            type="number"
            value={formData.year || ''}
            onChange={(e) => updateField('year', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="2015"
            min="1900"
            max={new Date().getFullYear() + 1}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_location">Base Location</Label>
          <Select
            value={formData.base_location}
            onValueChange={(value) => updateField('base_location', value)}
          >
            <SelectTrigger id="base_location">
              <SelectValue placeholder="Select airport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KAPA">KAPA - Centennial Airport</SelectItem>
              <SelectItem value="KBJC">KBJC - Rocky Mountain Metropolitan</SelectItem>
              <SelectItem value="KFTG">KFTG - Front Range Airport</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hobbs_hours">Hobbs Hours (Optional)</Label>
            <Input
              id="hobbs_hours"
              type="number"
              step="0.1"
              value={formData.hobbs_hours || ''}
              onChange={(e) => updateField('hobbs_hours', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="1234.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tach_hours">Tach Hours (Optional)</Label>
            <Input
              id="tach_hours"
              type="number"
              step="0.1"
              value={formData.tach_hours || ''}
              onChange={(e) => updateField('tach_hours', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="1200.0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="average_monthly_hours">Average Monthly Flying Hours</Label>
          <Input
            id="average_monthly_hours"
            type="number"
            step="0.5"
            value={formData.average_monthly_hours || ''}
            onChange={(e) => updateField('average_monthly_hours', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="15"
          />
          <p className="text-xs text-muted-foreground">
            This helps us recommend the best service tier for you
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_use">Primary Use (Optional)</Label>
          <Select
            value={formData.primary_use}
            onValueChange={(value) => updateField('primary_use', value)}
          >
            <SelectTrigger id="primary_use">
              <SelectValue placeholder="Select primary use" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal/Recreational</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="training">Flight Training</SelectItem>
              <SelectItem value="charter">Charter</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
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

