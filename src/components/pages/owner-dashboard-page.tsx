'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { DemoBanner } from '@/components/demo-banner';
import { useDemoMode } from '@/hooks/use-demo-mode';
import { DEMO_AIRCRAFT } from '@/lib/demo-data';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isStaffRole } from '@/lib/roles';
import { DashboardLayout } from '@/components/dashboard/layout';
import { ownerDashboardNavItems } from '@/components/dashboard/nav-items';
import { ThemeToggle } from '@/components/theme-toggle';
import { QuickActions } from '@/features/owner/components/QuickActions';
import { AircraftVitalsStrip } from '@/features/owner/components/AircraftVitalsStrip';

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const router = useRouter();

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !isDemo,
    retry: false,
  });

  const isStaff = isStaffRole(userProfile?.role ?? null);

  useEffect(() => {
    if (!isDemo && user && userProfile && isStaff) {
      router.push('/staff');
    }
  }, [user, userProfile, isStaff, isDemo, router]);

  const { data: aircraftList, isLoading: aircraftLoading } = useQuery({
    queryKey: ['aircraft', 'owner-list', isDemo ? 'demo' : user?.id],
    enabled: isDemo || Boolean(user?.id),
    queryFn: async () => {
      if (isDemo) return [DEMO_AIRCRAFT];
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;
      return data || [];
    }
  });

  const aircraft = aircraftList?.[0];

  const readinessStatus = 'Ready';
  const isReady = true;
  const fuelLevel = 85;

  const { data: membership = null } = useQuery({
    queryKey: ['membership', isDemo ? 'demo' : user?.id],
    enabled: isDemo || Boolean(user?.id),
    queryFn: async () => {
      if (isDemo) {
        const { DEMO_MEMBERSHIP } = await import('@/lib/demo-data');
        return DEMO_MEMBERSHIP;
      }
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching membership:', error);
        return null;
      }

      return data;
    },
  });

  return (
    <DashboardLayout
      title="Dashboard"
      description="Quick actions for your aircraft"
      navItems={ownerDashboardNavItems}
      titleTestId="text-dashboard-title"
      actions={<ThemeToggle />}
    >
      {isDemo && <DemoBanner />}

      {aircraft ? (
        <AircraftVitalsStrip
          aircraft={aircraft}
          membership={membership}
          fuelLevel={fuelLevel}
          isReady={isReady}
          readinessStatus={readinessStatus}
        />
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {aircraftLoading ? (
              <div className="animate-pulse">Loading aircraft information...</div>
            ) : (
              <div>No aircraft assigned</div>
            )}
          </CardContent>
        </Card>
      )}

      {aircraft && (
        <QuickActions
          aircraftId={aircraft.id}
          userId={user?.id || ''}
          aircraftData={{
            id: aircraft.id,
            tail_number: aircraft.tail_number,
            base_location: aircraft.base_location,
          }}
          isDemo={isDemo}
        />
      )}
    </DashboardLayout>
  );
}
