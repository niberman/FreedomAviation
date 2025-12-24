'use client';

import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { RampDashboard } from "@/components/ramp-dashboard";

export default function StaffRamp() {
  return (
    <DashboardLayout
      title="Ramp Operations"
      description="Mobile Task List for Ground Crew"
      navItems={staffDashboardNavItems}
      actions={<ThemeToggle />}
    >
      <RampDashboard />
    </DashboardLayout>
  );
}













