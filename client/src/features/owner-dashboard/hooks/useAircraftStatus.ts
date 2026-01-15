import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AircraftOperationalStatus } from "../types";

export function useAircraftStatus(aircraftId: string | undefined) {
  return useQuery({
    queryKey: ["aircraft-operational-status", aircraftId],
    enabled: !!aircraftId,
    queryFn: async () => {
      // 1. Check for high-priority squawks
      const { data: squawks } = await supabase
        .from("service_requests")
        .select("id")
        .eq("aircraft_id", aircraftId)
        .eq("service_type", "squawk")
        .eq("priority", "high")
        .not("status", "eq", "completed")
        .not("status", "eq", "cancelled");

      if (squawks && squawks.length > 0) return 'GROUNDED' as AircraftOperationalStatus;

      // 2. Check for active maintenance tasks
      const { data: tasks } = await supabase
        .from("service_tasks")
        .select("id")
        .eq("aircraft_id", aircraftId)
        .not("status", "eq", "completed")
        .not("status", "eq", "cancelled");

      if (tasks && tasks.length > 0) return 'MAINTENANCE' as AircraftOperationalStatus;

      return 'READY TO FLY' as AircraftOperationalStatus;
    },
  });
}
