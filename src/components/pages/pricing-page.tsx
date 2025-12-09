'use client';

import { NavBar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import PricingFixed from '@/components/PricingFixed';

export function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <PricingFixed />
      </main>
      <Footer />
    </div>
  );
}

