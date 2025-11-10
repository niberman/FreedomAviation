export type OnboardingStep = 'welcome' | 'personal-info' | 'aircraft-info' | 'membership' | 'payment' | 'complete';

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
  package_id: 'class-i' | 'class-ii' | 'class-iii';
  hours_band: '0-10' | '10-25' | '25-40' | '40+';
  addons?: string[];
}

export interface OnboardingData {
  step: OnboardingStep;
  personal_info?: PersonalInfo;
  aircraft_info?: AircraftInfo;
  membership_selection?: MembershipSelection;
  completed: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface OnboardingState extends OnboardingData {
  currentStep: number;
  totalSteps: number;
}

