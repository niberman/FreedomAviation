import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function StaffProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isDev = !import.meta.env.PROD;

  // Fetch user profile to check role
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid throwing on no rows
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    retry: false,
  });

  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    // In dev mode, skip all redirects - allow access
    if (isDev) {
      console.warn('⚠️ DEV MODE: Allowing access to staff dashboard without authentication');
      return;
    }

    if (!isLoading) {
      if (!user) {
        // Not logged in, redirect to login
        setLocation('/login');
      } else if (profileError) {
        // Error fetching profile, redirect to login
        console.error('Profile fetch error:', profileError);
        setLocation('/login');
      } else if (userProfile && userProfile.role !== 'admin' && userProfile.role !== 'cfi') {
        // Logged in but not staff, redirect to home
        setLocation('/');
      }
    }
  }, [user, userProfile, isLoading, profileError, setLocation, isDev, authLoading]);

  // In dev mode, allow access immediately - bypass all checks
  if (isDev) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black px-4 py-2 text-center text-sm font-semibold">
          ⚠️ DEV MODE: Staff dashboard accessed without authentication
        </div>
        {children}
      </>
    );
  }

  // Production mode checks below
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has staff role
  if (userProfile && userProfile.role !== 'admin' && userProfile.role !== 'cfi') {
    return null;
  }

  // Show error state if profile fetch failed
  if (profileError) {
    return null;
  }

  return <>{children}</>;
}

