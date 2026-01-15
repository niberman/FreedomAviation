import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { NormalizedFeedItem, FeedItemType } from "../types";
import { ServiceRequest, InstructionRequest, Invoice } from "@/shared/database-types";

export function useOpsFeed(userId: string | undefined, aircraftId: string | undefined) {
  return useQuery({
    queryKey: ["ops-feed", userId, aircraftId],
    enabled: !!userId && !!aircraftId,
    queryFn: async () => {
      const [servicesRes, instructionsRes, invoicesRes] = await Promise.all([
        supabase
          .from("service_requests")
          .select("*")
          .eq("aircraft_id", aircraftId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("instruction_requests")
          .select("*")
          .eq("aircraft_id", aircraftId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("invoices")
          .select("*")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const normalized: NormalizedFeedItem[] = [];

      // Normalize Service Requests (Staging & Squawks)
      (servicesRes.data || []).forEach((item: ServiceRequest) => {
        const type: FeedItemType = item.service_type === 'staging' ? 'staging' : 'squawk';
        normalized.push({
          id: item.id,
          type,
          title: type === 'staging' ? 'Staging Request' : 'Squawk Reported',
          status: item.status,
          date: item.created_at,
          description: item.description || undefined,
          metadata: {
            priority: item.priority,
            requested_departure: item.requested_departure,
            fuel_quantity: item.fuel_quantity,
            fuel_grade: item.fuel_grade,
            cabin_provisioning: item.cabin_provisioning,
            hangar_pullout: item.hangar_pullout,
          },
          originalData: item,
        });
      });

      // Normalize Instruction Requests
      (instructionsRes.data || []).forEach((item: InstructionRequest) => {
        normalized.push({
          id: item.id,
          type: 'instruction',
          title: 'Instruction Session',
          status: item.status || 'pending',
          date: item.created_at,
          description: item.notes || undefined,
          metadata: {
            requested_date: item.requested_date,
            instruction_type: item.instruction_type,
          },
          originalData: item,
        });
      });

      // Normalize Invoices
      (invoicesRes.data || []).forEach((item: Invoice) => {
        normalized.push({
          id: item.id,
          type: 'invoice',
          title: `Invoice #${item.invoice_number}`,
          status: item.status,
          date: item.created_at,
          metadata: {
            amount: item.amount,
            category: item.category,
            hosted_invoice_url: item.hosted_invoice_url,
          },
          originalData: item,
        });
      });

      return normalized.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
  });
}
