'use client';

import { usePathname } from 'next/navigation';

export function useDemoMode() {
  const pathname = usePathname();
  const isDemo = pathname === '/demo';

  return { isDemo };
}
