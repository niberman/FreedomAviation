import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <Alert className="mb-6 border-primary/50 bg-primary/10">
      <Info className="h-4 w-4" />
      <AlertDescription>
        <strong>DEMO MODE</strong> - You're viewing a read-only demonstration. Actions are disabled.
      </AlertDescription>
    </Alert>
  );
}
