import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { isStaffRole } from '@/lib/roles';

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
      if (error) {
        console.error('Error fetching user profile in StaffProtectedRoute:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
      if (!data) {
        console.warn('User profile not found for user:', user.id);
      }
      // Trim the role value to handle any whitespace issues
      if (data && data.role) {
        data.role = data.role.trim();
      }
      return data;
    },
    enabled: !!user,
    retry: 2, // Retry up to 2 times in case of transient errors
    retryDelay: 1000, // Wait 1 second between retries
  });

  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    // In dev mode, skip all redirects - allow access (silenced)
    if (isDev) {
      return;
    }

    if (!isLoading) {
      if (!user) {
        // Not logged in, redirect to login
        console.log('StaffProtectedRoute: No user, redirecting to login');
        setLocation('/login');
      } else if (profileError) {
        // Error fetching profile - log details but don't immediately redirect
        // The profile might be created by a trigger that's still processing
        console.error('Profile fetch error in StaffProtectedRoute:', profileError);
        console.error('User ID:', user.id);
        console.error('User email:', user.email);
        
        // Check if it's a permission/RLS error vs profile not existing
        const errorWithCode = profileError as any;
        const isPermissionError = profileError.message?.includes('permission') || 
                                  profileError.message?.includes('RLS') ||
                                  errorWithCode.code === 'PGRST301' ||
                                  errorWithCode.code === '42501';
        
        if (isPermissionError) {
          console.error('Permission/RLS error detected. User may not have access to their own profile.');
          console.error('This could indicate an RLS policy issue. Check that "Users can view own profile" policy exists.');
        }
        
        // Redirect to login after a short delay to allow for profile creation
        // But only if we've retried and still failed
        setTimeout(() => {
          setLocation('/login');
        }, 2000);
      } else if (userProfile) {
        // Check role
        if (!isStaffRole(userProfile.role)) {
          console.log('StaffProtectedRoute: User is not staff (role:', userProfile.role, '), redirecting to home');
          setLocation('/');
        } else {
          console.log('StaffProtectedRoute: User is staff (role:', userProfile.role, '), allowing access');
        }
      } else if (!userProfile && !profileError) {
        // Profile doesn't exist and no error (shouldn't happen, but handle it)
        console.warn('StaffProtectedRoute: No profile found and no error. User may need to wait for profile creation.');
      }
    }
  }, [user, userProfile, isLoading, profileError, setLocation, isDev, authLoading]);

  // In dev mode, allow access immediately - bypass all checks
  if (isDev) {
    return <>{children}</>;
  }

  // Production mode checks below
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  // If we have a profile error, show a helpful message
  if (profileError) {
    const errorWithCode = profileError as any;
    const isPermissionError = profileError.message?.includes('permission') || 
                              profileError.message?.includes('RLS') ||
                              errorWithCode.code === 'PGRST301' ||
                              errorWithCode.code === '42501';
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold mb-2">Unable to verify access</h2>
          <p className="text-muted-foreground mb-4">
            {isPermissionError 
              ? "There was an issue verifying your permissions. Please contact support if this persists."
              : "There was an issue loading your profile. Please try refreshing the page."}
          </p>
          <p className="text-sm text-muted-foreground">
            Error: {profileError.message || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  // Check if user has staff role
  if (userProfile) {
    if (!isStaffRole(userProfile.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
    // User is staff, allow access
    return <>{children}</>;
  }

  // Profile doesn't exist yet - might be creating, show loading
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Setting up your account...</p>
      </div>
    </div>
  );
}

