import { redirect } from 'next/navigation';

// Redirect /admin/manage to /admin, preserving tab deep-links to the console.
export default async function AdminManage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  if (tab) {
    redirect(`/admin/console?tab=${encodeURIComponent(tab)}`);
  }
  redirect('/admin');
}



















