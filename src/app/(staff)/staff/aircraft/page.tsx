'use client';

import { DashboardLayout } from "@/components/dashboard/layout";
import { staffDashboardNavItems } from "@/components/dashboard/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { AircraftTable } from "@/components/staff/aircraft-table";
import { Card, CardContent } from "@/components/ui/card";
import { Plane } from "lucide-react";
import { useAircraftTable } from "@/hooks/useAircraft";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function StaffAircraft() {
  const { user } = useAuth();
  const { aircraftFull, isLoading: isLoadingAircraft, isError: aircraftError } = useAircraftTable();

  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('role', 'owner')
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  return (
    <DashboardLayout
      title="Aircraft"
      description="View and manage all aircraft in the fleet"
      navItems={staffDashboardNavItems}
      actions={<ThemeToggle />}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Fleet Management</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Track aircraft details, ownership, and maintenance status
        </p>
      </div>

      {isLoadingAircraft ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading aircraft...</p>
          </CardContent>
        </Card>
      ) : aircraftError ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium mb-2">Error loading aircraft</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AircraftTable items={aircraftFull} owners={owners} />
      )}
    </DashboardLayout>
  );
}
