import { redirect } from 'next/navigation';

// Pricing configurator is now embedded in the main pricing page
// This route redirects for backwards compatibility
export default function PricingConfigurator() {
  redirect('/pricing');
}
