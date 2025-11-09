import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientsTable } from "@/components/clients-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function StaffMembers() {
  return (
    <DashboardLayout
      title="Members"
      description="View and manage client accounts"
      navItems={staffDashboardNavItems}
      actions={<ThemeToggle />}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Client Management</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          View client details, membership status, and contact information
        </p>
      </div>
      
      <ClientsTable />
    </DashboardLayout>
  );
}