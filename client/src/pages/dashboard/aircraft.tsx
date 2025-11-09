import { DashboardLayout } from "@/components/dashboard/layout";
import { ownerDashboardNavItems } from "@/components/dashboard/nav-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardAircraft() {
  return (
    <DashboardLayout
      title="Aircraft"
      description="Plan upcoming maintenance, dispatch availability, and readiness."
      navItems={ownerDashboardNavItems}
    >
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Your fleet workspace is warming up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            The aircraft hub will consolidate flight readiness, maintenance, and documentation.
            Continue iterating safely on the <Badge variant="outline">dashboard</Badge> branch.
          </p>
          <Button variant="outline" size="sm" disabled>
            Add aircraft (coming soon)
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

