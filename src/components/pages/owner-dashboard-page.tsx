'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DemoBanner } from '@/components/demo-banner';
import { useDemoMode } from '@/hooks/use-demo-mode';
import { DEMO_AIRCRAFT } from '@/lib/demo-data';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  Fuel,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAircraft } from '@/hooks/useAircraft';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { isStaffRole } from '@/lib/roles';
import { DashboardLayout } from '@/components/dashboard/layout';
import { ownerDashboardNavItems } from '@/components/dashboard/nav-items';
import { ThemeToggle } from '@/components/theme-toggle';
import { QuickActions } from '@/features/owner/components/QuickActions';
import Image from 'next/image';

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const { toast } = useToast();
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

  const { updateAircraft } = useAircraft();

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

  const queryClient = useQueryClient();

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

  const handleAircraftUpdate = async (field: string, value: string | number | null) => {
    if (!aircraft?.id || isDemo) return;

    try {
      await updateAircraft.mutateAsync({
        id: aircraft.id,
        data: { [field]: value },
      });

      queryClient.invalidateQueries({
        queryKey: ['aircraft', 'owner-list', isDemo ? 'demo' : user?.id]
      });

      toast({
        title: 'Aircraft updated',
        description: 'Your aircraft information has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating aircraft:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update aircraft';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };


  const fuelLevel = 85;

  return (
    <DashboardLayout
      title="Aircraft Command Center"
      description="Welcome back"
      navItems={ownerDashboardNavItems}
      titleTestId="text-dashboard-title"
      showHeader={false}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      }
    >
      {isDemo && <DemoBanner />}

      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Link href="/dashboard">
          <Button variant="default" size="sm" className="h-10 px-4">
            Overview
          </Button>
        </Link>
        <Link href="/dashboard/more">
          <Button variant="outline" size="sm" className="h-10 px-4">
            More
          </Button>
        </Link>
      </div>

      {aircraft ? (
        <Card className="overflow-hidden bg-slate-900 text-white border-slate-700 mb-6">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto min-h-[300px]">
                <Image
                  src="/images/premium_cirrus_sr22t_b2f4f8b8.jpg"
                  alt="Aircraft"
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h2 className="text-3xl font-bold mb-1">{aircraft.tail_number}</h2>
                  <p className="text-slate-300">
                    {aircraft.year} {aircraft.make} {aircraft.model}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Aircraft Vitals</h3>
                  <Image
                    src="/images/falogo.png"
                    alt="Freedom Aviation"
                    width={24}
                    height={24}
                    className="h-6 w-auto opacity-70"
                    style={{ width: 'auto' }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Status</span>
                    <Badge
                      variant={isReady ? 'default' : 'destructive'}
                      className={isReady ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/50 animate-pulse' : ''}
                    >
                      {isReady ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ready to Fly
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {readinessStatus}
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      Fuel Level (Est.)
                    </span>
                    <span className="text-sm font-semibold">{fuelLevel}%</span>
                  </div>
                  <Progress value={fuelLevel} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Hangar Location
                    </span>
                    <span className="text-sm font-semibold">
                      {aircraft.base_location || 'KAPA'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
                  <div>
                    <div className="text-xs text-slate-400">Hobbs Time</div>
                    <div className="text-lg font-semibold">
                      {aircraft.hobbs_hours?.toFixed(1) || 'N/A'} hrs
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Tach Time</div>
                    <div className="text-lg font-semibold">
                      {aircraft.tach_hours?.toFixed(1) || 'N/A'} hrs
                    </div>
                  </div>
                </div>

                {membership && (
                  <div className="pt-2">
                    <Badge variant="secondary" className="bg-slate-800 text-slate-200">
                      {membership.tier} Member
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
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
        <div className="mb-6">
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
        </div>
      )}
    </DashboardLayout>
  );
}

