import { Metadata } from 'next';
import { OnboardingPage } from '@/components/pages/onboarding-page';

export const metadata: Metadata = {
  title: 'Welcome to Freedom Aviation - Complete Your Setup',
  description: 'Complete your Freedom Aviation membership setup. Add your aircraft, select your package, and get started with premium aircraft management.',
};

export default function Onboarding() {
  return <OnboardingPage />;
}
