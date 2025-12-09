'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export function AuthRedirectHandler() {
  const pathname = usePathname();
  const { session, loading } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only process once per mount
    if (hasProcessed.current || loading) {
      return;
    }

    // Check if we have an auth token in the URL hash
    const hash = window.location.hash;
    
    if (hash && hash.includes('access_token')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const tokenType = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (tokenType === 'recovery' && accessToken) {
        // Password recovery token
        hasProcessed.current = true;
        
        if (pathname !== '/reset-password') {
          console.log('[AuthRedirectHandler] Recovery token detected, redirecting to /reset-password');
          window.location.href = `/reset-password${hash}`;
        }
      } else if (tokenType === 'invite' && accessToken && refreshToken) {
        // User invitation token - only process if not already signed in
        if (!session) {
          hasProcessed.current = true;
          
          // Set the session first so the user is authenticated
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }).then(({ data, error }) => {
            if (error) {
              console.error('[AuthRedirectHandler] Error setting invite session:', error);
            } else {
              console.log('[AuthRedirectHandler] Invite token processed, redirecting to /onboarding');
              // Redirect to onboarding without the hash
              window.location.href = '/onboarding';
            }
          });
        } else {
          // Already signed in, just clear the hash to avoid confusion
          console.log('[AuthRedirectHandler] Invite token detected but user already signed in, clearing hash');
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }, [loading, pathname, session]); // Run when loading completes

  return null;
}
