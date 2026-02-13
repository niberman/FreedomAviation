import { redirect } from 'next/navigation';

export default async function AdminConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  redirect(tab ? `/staff/console?tab=${encodeURIComponent(tab)}` : '/staff/console');
}
