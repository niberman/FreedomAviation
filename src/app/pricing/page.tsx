import { Metadata } from 'next';
import { PricingPage } from '@/components/pages/pricing-page';

export const metadata: Metadata = {
  title: 'Pricing - Aircraft Management & Flight Instruction',
  description: 'Transparent pricing for aircraft management, flight instruction, and hangar services at Centennial Airport. No hidden fees.',
};

export default function Pricing() {
  return <PricingPage />;
}

