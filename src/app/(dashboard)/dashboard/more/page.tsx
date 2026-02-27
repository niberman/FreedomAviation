'use client';

import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { ownerDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { DollarSign, Plane } from "lucide-react";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";
import { PasswordChangeCard } from "@/features/owner/components/PasswordChangeCard";
import { DemoBanner } from "@/components/DemoBanner";
import { useOwnerMore } from "@/hooks/useOwnerMore";
import type { ComponentProps } from "react";

type BillingInvoice = ComponentProps<typeof BillingCard>['invoices'][number];

function OwnerMoreContent() {
  const { isDemo, serviceRequests, isLoadingRequests, invoices, invoicesLoading } = useOwnerMore();

  return (
    <DashboardLayout title="Operations & Billing" description="Manage your account, billing, and service history." navItems={ownerDashboardNavItems} actions={<ThemeToggle />}>
      {isDemo && <DemoBanner />}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Billing & Invoices</h3>
        </div>
        <BillingCard invoices={invoices as BillingInvoice[]} isLoading={invoicesLoading} />
      </section>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Service History</h3>
        </div>
        <ServiceTimeline requests={serviceRequests} isLoading={isLoadingRequests} />
      </section>
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Account & Settings</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PasswordChangeCard />
          <DocsCard />
        </div>
      </section>
    </DashboardLayout>
  );
}

export default function OwnerMore() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <OwnerMoreContent />
    </Suspense>
  );
}
