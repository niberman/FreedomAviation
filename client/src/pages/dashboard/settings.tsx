import { DashboardLayout } from "@/components/dashboard/layout";
import { ownerDashboardNavItems } from "@/components/dashboard/nav-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function DashboardSettings() {
  return (
    <DashboardLayout
      title="Settings"
      description="Control notifications, account security, and integrations."
      navItems={ownerDashboardNavItems}
    >
      <Card>
        <CardHeader>
          <CardTitle>General Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="setting-notifications" className="text-sm font-medium">
              Enable maintenance notifications
            </Label>
            <Switch id="setting-notifications" disabled />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="setting-billing" className="text-sm font-medium">
              Auto-email billing summaries
            </Label>
            <Switch id="setting-billing" disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            These toggles are placeholders. Wire new settings here on the <code>dashboard</code> branch
            so production marketing pages stay stable.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

