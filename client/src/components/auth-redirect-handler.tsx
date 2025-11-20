import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

export function AuthRedirectHandler() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check if we have a recovery token in the URL hash
    const hash = window.location.hash;
    
    if (hash && hash.includes('type=recovery') && hash.includes('access_token')) {
      console.log('[AuthRedirectHandler] Recovery token detected in URL');
      
      // If we're not already on the reset-password page, redirect there
      if (location !== '/reset-password') {
        console.log('[AuthRedirectHandler] Redirecting to /reset-password with token');
        // Preserve the full hash when redirecting
        window.location.href = `/reset-password${hash}`;
        return;
      }
      
      // If we ARE on the reset-password page, let's verify the token is being processed
      console.log('[AuthRedirectHandler] Already on reset-password page, verifying token...');
      
      // Try to manually verify the session after a short delay
      setTimeout(async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthRedirectHandler] Error getting session:', error);
        } else if (session) {
          console.log('[AuthRedirectHandler] Session verified after recovery token');
        } else {
          console.log('[AuthRedirectHandler] No session found after recovery token - token may be invalid');
        }
      }, 1000);
    }
  }, [location]);

  return null;
}