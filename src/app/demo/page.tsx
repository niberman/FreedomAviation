import { Metadata } from 'next';
import { DemoPage } from '@/components/pages/demo-page';

export const metadata: Metadata = {
  title: 'Demo - Owner Portal',
  description: 'Experience the Freedom Aviation owner portal in demo mode.',
};

export default function Demo() {
  return <DemoPage />;
}












