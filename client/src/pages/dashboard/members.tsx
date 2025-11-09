import { DashboardLayout } from "@/components/dashboard/layout";
import { ownerDashboardNavItems } from "@/components/dashboard/nav-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DashboardMembers() {
  return (
    <DashboardLayout
      title="Members"
      description="Track membership status, contact information, and engagement."
      navItems={ownerDashboardNavItems}
    >
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Members workspace is coming soon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            We&apos;re preparing dedicated tooling for member management. Build new features
            on the <code>dashboard</code> branch without impacting the marketing site.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard">
              <Button variant="default" size="sm">
                Return to overview
              </Button>
            </Link>
            <Button variant="outline" size="sm" disabled>
              Invite member (coming soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

