import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { isStaffRole } from "@/lib/roles";
import { OwnerDashboardFeature } from "@/features/owner-dashboard/OwnerDashboard";
import { DemoBanner } from "@/components/DemoBanner";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const [, setLocation] = useLocation();

  // 1. Role Check & Redirection
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
      setLocation('/staff');
    }
  }, [user, userProfile, isStaff, isDemo, setLocation]);

  // 2. Render Feature
  return (
    <>
      {isDemo && <DemoBanner />}
      <OwnerDashboardFeature />
    </>
  );
}
