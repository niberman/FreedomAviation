import { Metadata } from 'next';
import { AboutPage } from '@/components/pages/about-page';

export const metadata: Metadata = {
  title: 'About Freedom Aviation - Colorado Aircraft Management Experts at KAPA',
  description: 'Learn about Freedom Aviation\'s mission to make aircraft ownership effortless at Centennial Airport Colorado. Expert aircraft management, transparent pricing, and personalized service for owner-pilots across the Front Range since 2024.',
  alternates: {
    canonical: '/about',
  },
};

export default function About() {
  return <AboutPage />;
}





