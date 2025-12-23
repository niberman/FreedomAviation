import { Metadata } from 'next';
import { PricingPage } from '@/components/pages/pricing-page';

export const metadata: Metadata = {
  title: 'Aircraft Management Pricing - Get Your Custom Quote',
  description: 'Transparent aircraft management pricing with our instant quote calculator. Choose your service tier, flight hours, and hangar location. Premium services for owner-operators at Centennial Airport.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function Pricing() {
  return <PricingPage />;
}





