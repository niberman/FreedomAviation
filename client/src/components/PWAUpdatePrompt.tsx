import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Wifi, WifiOff, X } from "lucide-react";

interface PWAUpdatePromptProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
  show: boolean;
  offlineReady?: boolean;
}

export function PWAUpdatePrompt({ 
  onUpdate, 
  onDismiss, 
  show, 
  offlineReady 
}: PWAUpdatePromptProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {offlineReady ? (
                <WifiOff className="h-5 w-5 text-green-600" />
              ) : (
                <Download className="h-5 w-5 text-blue-600" />
              )}
              <CardTitle className="text-lg">
                {offlineReady ? "Offline Ready" : "Update Available"}
              </CardTitle>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -mr-1"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            )}
          </div>
          <CardDescription>
            {offlineReady 
              ? "The app is now ready to work offline."
              : "A new version of the app is available."}
          </CardDescription>
        </CardHeader>
        {!offlineReady && onUpdate && (
          <CardFooter className="pt-0">
            <Button onClick={onUpdate} className="w-full">
              Update Now
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
          isOnline
            ? "bg-green-600 text-white"
            : "bg-orange-600 text-white"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You're offline</span>
          </>
        )}
      </div>
    </div>
  );
}

