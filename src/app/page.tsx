import { Metadata } from 'next';
import { HomePage } from '@/components/pages/home-page';

export const metadata: Metadata = {
  title: 'Premium Aircraft Management & Flight Instruction at Centennial Airport Colorado',
  description:
    'Freedom Aviation - Colorado\'s premier aircraft management and flight instruction at Centennial Airport (KAPA). Transparent pricing, expert care, owner-pilot focused. Serving Denver, Colorado Springs, and the entire Front Range. Just fly. We handle everything.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return <HomePage />;
}





