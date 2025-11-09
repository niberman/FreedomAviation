import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function StaffOperations() {
  return (
    <DashboardLayout
      title="Staff · Operations"
      description="Organize ground, instruction, and concierge workflows."
      navItems={staffDashboardNavItems}
    >
      <Tabs defaultValue="ground">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ground">Ground</TabsTrigger>
          <TabsTrigger value="instruction">Instruction</TabsTrigger>
          <TabsTrigger value="concierge">Concierge</TabsTrigger>
        </TabsList>
        <TabsContent value="ground">
          <PlaceholderCard title="Ground operations" />
        </TabsContent>
        <TabsContent value="instruction">
          <PlaceholderCard title="Instruction scheduling" />
        </TabsContent>
        <TabsContent value="concierge">
          <PlaceholderCard title="Concierge services" />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

function PlaceholderCard({ title }: { title: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Prototype flow assignments and SOP checklists here. Publish to the <Badge variant="outline">dashboard</Badge> branch
          while production marketing pages remain stable.
        </p>
      </CardContent>
    </Card>
  );
}

