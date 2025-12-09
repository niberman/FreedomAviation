import { Metadata } from 'next';
import { HangarsPage } from '@/components/pages/hangars-page';

export const metadata: Metadata = {
  title: 'Hangar Services',
  description: 'Premium hangar services and facilities at Centennial Airport (KAPA). Climate-controlled hangars with full-service amenities.',
};

export default function Hangars() {
  return <HangarsPage />;
}

