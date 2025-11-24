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
      <div className="space-y-1 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <h2 className="text-lg sm:text-2xl font-semibold">System Settings</h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage pricing, user accounts, and system configuration
        </p>
      </div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4" />
              Pricing Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Configure membership pricing, service rates, and location-specific costs
            </p>
            <Button asChild className="w-full touch-manipulation">
              <Link href="/admin/pricing">
                Manage Pricing
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-4 w-4" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Add new staff members, manage roles, and configure permissions
            </p>
            <Button variant="secondary" className="w-full touch-manipulation" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CreditCard className="h-4 w-4" />
              Payment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Configure Stripe integration and payment processing options
            </p>
            <Button variant="secondary" className="w-full touch-manipulation" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h3>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
          <Button variant="outline" asChild className="w-full sm:w-auto touch-manipulation">
            <Link href="/staff">
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto touch-manipulation">
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
              Supabase Dashboard
            </a>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto touch-manipulation">
            <a href="/api/health" target="_blank">
              API Health Check
            </a>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}