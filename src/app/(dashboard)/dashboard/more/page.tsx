'use client';

import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { ownerDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { DollarSign, Plane, Settings } from "lucide-react";
import { ServiceTimeline } from "@/features/owner/components/ServiceTimeline";
import { BillingCard } from "@/features/owner/components/BillingCard";
import { DocsCard } from "@/features/owner/components/DocsCard";
import { PasswordChangeCard } from "@/features/owner/components/PasswordChangeCard";
import { NotificationPreferencesCard } from "@/features/owner/components/NotificationPreferencesCard";
import { DemoBanner } from "@/components/demo-banner";
import { useOwnerMore } from "@/hooks/useOwnerMore";
import type { ComponentProps } from "react";

type BillingInvoice = ComponentProps<typeof BillingCard>['invoices'][number];

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Settings;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
      <div>
        <h3 className="text-lg font-semibold leading-tight">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function OwnerMoreContent() {
  const { isDemo, serviceRequests, isLoadingRequests, invoices, invoicesLoading } = useOwnerMore();

  return (
    <DashboardLayout
      title="More"
      description="Billing, service history, and account settings."
      navItems={ownerDashboardNavItems}
      actions={<ThemeToggle />}
    >
      {isDemo && <DemoBanner />}

      <section className="space-y-3">
        <SectionHeader
          icon={DollarSign}
          title="Billing & Invoices"
          description="Pay outstanding invoices and review past charges."
        />
        <BillingCard invoices={invoices as BillingInvoice[]} isLoading={invoicesLoading} />
      </section>

      <section className="space-y-3">
        <SectionHeader
          icon={Plane}
          title="Service History"
          description="Every service request you've submitted, newest first."
        />
        <ServiceTimeline requests={serviceRequests} isLoading={isLoadingRequests} />
      </section>

      <section className="space-y-3">
        <SectionHeader
          icon={Settings}
          title="Account & Settings"
          description="Password, notifications, and document storage."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PasswordChangeCard />
          <NotificationPreferencesCard />
          <div className="lg:col-span-2">
            <DocsCard />
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default function OwnerMore() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <OwnerMoreContent />
    </Suspense>
  );
}
