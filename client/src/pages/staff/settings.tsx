import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, CreditCard, Users, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function StaffSettings() {
  return (
    <DashboardLayout
      title="Settings"
      description="Configure system settings and manage administrative options"
      navItems={staffDashboardNavItems}
      actions={<ThemeToggle />}
    >
      <div className="space-y-1 mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">System Settings</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage pricing, user accounts, and system configuration
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure membership pricing, service rates, and location-specific costs
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/pricing">
                Manage Pricing
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add new staff members, manage roles, and configure permissions
            </p>
            <Button variant="secondary" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure Stripe integration and payment processing options
            </p>
            <Button variant="secondary" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-12 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" asChild>
            <Link href="/staff">
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
              Supabase Dashboard
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/health" target="_blank">
              API Health Check
            </a>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}