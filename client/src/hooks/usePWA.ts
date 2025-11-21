import { useEffect, useState } from "react";

export interface PWAState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

export function usePWA(): PWAState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (import.meta.env.PROD) {
      import("virtual:pwa-register")
        .then(({ registerSW }) => {
          const update = registerSW({
            onNeedRefresh() {
              setNeedRefresh(true);
            },
            onOfflineReady() {
              setOfflineReady(true);
            },
            onRegistered(registration) {
              console.log("Service Worker registered", registration);
              
              // Check for updates every hour
              if (registration) {
                setInterval(() => {
                  registration.update();
                }, 60 * 60 * 1000);
              }
            },
            onRegisterError(error) {
              console.error("Service Worker registration error", error);
            },
          });
          setUpdateSW(() => update);
        })
        .catch((error) => {
          console.error("Failed to load PWA module:", error);
        });
    }
  }, []);

  const updateServiceWorker = async (reloadPage = false) => {
    if (updateSW) {
      await updateSW(reloadPage);
      setNeedRefresh(false);
    }
  };

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
  };
}


