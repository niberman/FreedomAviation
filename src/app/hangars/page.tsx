import { Metadata } from 'next';
import { HangarsPage } from '@/components/pages/hangars-page';

export const metadata: Metadata = {
  title: 'Premium Aircraft Hangars at KAPA - Sky Harbour & Freedom Aviation',
  description: 'Two premium hangar locations at Centennial Airport (KAPA). Climate-controlled, secure, 24/7 access with full aircraft management services. Choose Sky Harbour or Freedom Aviation Hangar.',
  alternates: {
    canonical: '/hangars',
  },
};

export default function Hangars() {
  return <HangarsPage />;
}





