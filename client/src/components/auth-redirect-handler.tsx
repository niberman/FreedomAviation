import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function AuthRedirectHandler() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check if we have a recovery token in the URL hash
    const hash = window.location.hash;
    
    if (hash && hash.includes('type=recovery') && hash.includes('access_token')) {
      // We have a password recovery token!
      // If we're not already on the reset-password page, redirect there
      if (location !== '/reset-password') {
        console.log('Password recovery token detected, redirecting to /reset-password');
        // Preserve the full hash when redirecting
        window.location.href = `/reset-password${hash}`;
      }
    }
  }, [location, setLocation]);

  return null;
}
