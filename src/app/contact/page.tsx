import { Metadata } from 'next';
import { ContactPage } from '@/components/pages/contact-page';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Freedom Aviation. Schedule a tour of our facilities at Centennial Airport (KAPA).',
};

export default function Contact() {
  return <ContactPage />;
}

