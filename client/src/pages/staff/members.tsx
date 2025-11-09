import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StaffMembers() {
  return (
    <DashboardLayout
      title="Staff · Members"
      description="Coordinate member outreach and concierge support."
      navItems={staffDashboardNavItems}
    >
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Member coordination is planned</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Use this space to design staff tools for managing member relationships.
            Iterations here stay isolated on the <code>dashboard</code> branch.
          </p>
          <Button variant="outline" size="sm" disabled>
            Assign concierge (coming soon)
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

