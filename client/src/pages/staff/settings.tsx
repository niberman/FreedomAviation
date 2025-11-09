import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function StaffSettings() {
  return (
    <DashboardLayout
      title="Staff · Settings"
      description="Control alerting, task routing, and internal integrations."
      navItems={staffDashboardNavItems}
    >
      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-muted-foreground">
          <PreferenceToggle id="ops-alerts" label="Notify operations team on high-priority requests" />
          <PreferenceToggle id="maintenance-alerts" label="Auto-subscribe to maintenance events" />
          <PreferenceToggle id="billing-alerts" label="Send daily invoice digests" />
          <p className="text-xs">
            These switches are placeholders for future automation. Implement real logic on the <code>dashboard</code> branch only.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

function PreferenceToggle({ id, label }: { id: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <Switch id={id} disabled />
    </div>
  );
}

