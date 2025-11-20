import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

export function AuthRedirectHandler() {
  const [location] = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only process once per mount
    if (hasProcessed.current) {
      return;
    }

    // Check if we have a recovery token in the URL hash
    const hash = window.location.hash;
    
    if (hash && hash.includes('type=recovery') && hash.includes('access_token')) {
      hasProcessed.current = true;
      
      // If we're not already on the reset-password page, redirect there
      if (location !== '/reset-password') {
        console.log('[AuthRedirectHandler] Recovery token detected, redirecting to /reset-password');
        // Preserve the full hash when redirecting
        window.location.href = `/reset-password${hash}`;
      }
    }
  }, []); // Empty dependency array - only run once

  return null;
}