import type { PricingTier, HoursRange } from '@/lib/unified-pricing';

export type OnboardingStep = 'welcome' | 'personal-info' | 'aircraft-info' | 'membership' | 'quote' | 'complete';

export interface PersonalInfo {
  full_name: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface AircraftInfo {
  tail_number: string;
  make: string;
  model: string;
  year?: number;
  base_location?: string;
  hobbs_hours?: number;
  tach_hours?: number;
  average_monthly_hours?: number;
  primary_use?: string;
}

export interface MembershipSelection {
  package_id: PricingTier | string; // Support both new and legacy formats
  hours_band?: HoursRange;
  hangar_id?: string;
  hangar_cost?: number;
  base_monthly?: number;
  addons?: string[];
}

export interface OnboardingData {
  step: OnboardingStep;
  personal_info?: PersonalInfo;
  aircraft_info?: AircraftInfo;
  membership_selection?: MembershipSelection;
  completed: boolean;
  quote_generated?: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface OnboardingState extends OnboardingData {
  currentStep: number;
  totalSteps: number;
}

