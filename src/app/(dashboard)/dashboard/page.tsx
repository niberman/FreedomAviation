import { Metadata } from 'next';
import { OwnerDashboardPage } from '@/components/pages/owner-dashboard-page';

export const metadata: Metadata = {
  title: 'Owner Dashboard',
  description: 'Manage your aircraft and services.',
};

export default function Dashboard() {
  return <OwnerDashboardPage />;
}


















