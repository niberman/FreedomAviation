import { Metadata } from 'next';
import { ContactPage } from '@/components/pages/contact-page';

export const metadata: Metadata = {
  title: 'Contact Freedom Aviation - Centennial Airport Colorado Aircraft Management',
  description: 'Contact Freedom Aviation for premium aircraft management and flight instruction at Centennial Airport (KAPA) Colorado. Call (970) 618-2094 or email. Serving Denver and the Front Range.',
  alternates: {
    canonical: '/contact',
  },
};

export default function Contact() {
  return <ContactPage />;
}





