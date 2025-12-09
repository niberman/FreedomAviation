'use client';

import { useEffect, useState, useCallback } from "react";

export interface PWAState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

/**
 * PWA hook for Next.js
 * Note: Next.js handles PWA differently than Vite.
 * For full PWA support, consider using next-pwa package.
 */
export function usePWA(): PWAState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Only run on client side in production
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return;
    }

    // Register service worker
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registered', reg);
        setRegistration(reg);

        // Check for updates on registration
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          }
        });

        // Check if ready for offline
        if (reg.active) {
          setOfflineReady(true);
        }

        // Check for updates periodically (every hour)
        const interval = setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);

        return () => clearInterval(interval);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }, []);

  const updateServiceWorker = useCallback(async (reloadPage = false) => {
    if (registration?.waiting) {
      // Tell the waiting service worker to activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      if (reloadPage) {
        window.location.reload();
      }
    }
    setNeedRefresh(false);
  }, [registration]);

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
  };
}
