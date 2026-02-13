import { StaffHomePage } from '@/components/pages/staff-home-page';
import { redirect } from 'next/navigation';

export default async function StaffManagePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  if (tab) {
    redirect(`/staff/console?tab=${encodeURIComponent(tab)}`);
  }
  return <StaffHomePage />;
}
