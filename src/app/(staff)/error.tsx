'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StaffError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Staff dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">Staff Dashboard Error</h1>
        <p className="text-muted-foreground mb-8">
          Something went wrong. Please try again or contact support.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/staff">Staff home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
