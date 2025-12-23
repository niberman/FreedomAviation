import { Metadata } from 'next';
import { StaffHomePage } from '@/components/pages/staff-home-page';

export const metadata: Metadata = {
  title: 'Staff Dashboard',
  description: 'Freedom Aviation staff dashboard.',
};

export default function StaffHome() {
  return <StaffHomePage />;
}












