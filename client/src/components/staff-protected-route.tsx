import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function StaffProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user profile to check role
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in, redirect to login
        setLocation('/login');
      } else if (userProfile && userProfile.role !== 'admin' && userProfile.role !== 'cfi') {
        // Logged in but not staff, redirect to home
        setLocation('/');
      }
    }
  }, [user, userProfile, isLoading, setLocation]);

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

  return <>{children}</>;
}

