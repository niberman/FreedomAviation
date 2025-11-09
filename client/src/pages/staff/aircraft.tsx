import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StaffAircraft() {
  return (
    <DashboardLayout
      title="Staff · Aircraft"
      description="Fleet readiness, discrepancies, and dispatch coordination."
      navItems={staffDashboardNavItems}
    >
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Aircraft operations tooling is in progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Build maintenance workflows and handoff checklists here without affecting the marketing site.
            Ship experiments by merging into the <Badge variant="outline">dashboard</Badge> branch.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

