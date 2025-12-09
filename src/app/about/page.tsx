import { Metadata } from 'next';
import { AboutPage } from '@/components/pages/about-page';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Freedom Aviation - Colorado\'s premier aircraft management company at Centennial Airport (KAPA).',
};

export default function About() {
  return <AboutPage />;
}

