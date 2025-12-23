import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { z } from "zod";
import type { ServiceRequest, ServiceRequestInsert, ServiceRequestUpdate, ServiceStatus } from "@/lib/types/database";

// Zod schemas for validation
export const serviceRequestSchema = z.object({
  aircraft_id: z.string().uuid("Invalid aircraft ID"),
  service_type: z.string().min(1, "Service type is required"),
  priority: z.enum(["low", "medium", "high"]).optional().nullable(),
  description: z.string().optional().nullable(),
  airport: z.string().regex(/^[A-Z0-9]{3,4}$/, "Airport must be 3-4 characters").optional().nullable(),
  requested_departure: z.string().datetime().optional().nullable(),
  fuel_grade: z.enum(["100LL", "Jet-A", "Jet-A+", "MOGAS"]).optional().nullable(),
  fuel_quantity: z.number().min(0).optional().nullable(),
  cabin_provisioning: z.union([z.record(z.any()), z.string()]).optional().nullable(),
  o2_topoff: z.boolean().optional().nullable(),
  tks_topoff: z.boolean().optional().nullable(),
  gpu_required: z.boolean().optional().nullable(),
  hangar_pullout: z.boolean().optional().nullable(),
  is_extra_charge: z.boolean().optional().nullable(),
  credits_used: z.number().min(0).optional().nullable(),
});

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

// Hook for getting a single service request
export function useServiceRequest(requestId?: string) {
  return useQuery({
    queryKey: ["service-requests", requestId],
    queryFn: async (): Promise<ServiceRequest | null> => {
      if (!requestId) return null;
      
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(requestId),
  });
}

export function useServiceRequests(aircraftId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all service requests for user/aircraft
  const serviceRequests = useQuery({
    queryKey: ["service-requests", user?.id, aircraftId],
    queryFn: async (): Promise<ServiceRequest[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user.id);

      if (aircraftId) {
        query = query.eq("aircraft_id", aircraftId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(user?.id),
  });

  // Get upcoming pre-flight requests
  const upcomingPreflights = useQuery({
    queryKey: ["service-requests", "upcoming", user?.id],
    queryFn: async (): Promise<ServiceRequest[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("service_type", "Pre-Flight Concierge")
        .not("requested_departure", "is", null)
        .gte("requested_departure", new Date().toISOString())
        .order("requested_departure", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(user?.id),
  });

  // Create service request mutation
  const createServiceRequest = useMutation({
    mutationFn: async (input: ServiceRequestFormData) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Validate input
      const validated = serviceRequestSchema.parse(input);

      const insertData: ServiceRequestInsert = {
        ...validated,
        description: validated.description ?? `Service request: ${validated.service_type}`,
        user_id: user.id,
        status: "pending",
        is_extra_charge: validated.is_extra_charge ?? false,
        credits_used: validated.credits_used ?? 0,
      };

      const { data, error } = await supabase
        .from("service_requests")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });

  // Update service request mutation
  const updateServiceRequest = useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: Partial<ServiceRequestFormData> & { status?: ServiceStatus } }) => {
      // Validate partial input
      const validated = serviceRequestSchema.partial().parse(updateData);

      const { data, error } = await supabase
        .from("service_requests")
        .update({
          ...validated,
          ...(updateData.status ? { status: updateData.status } : {}),
        } as ServiceRequestUpdate)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });

  // Cancel service request mutation
  const cancelServiceRequest = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("service_requests")
        .update({ status: "cancelled" as ServiceStatus })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });

  return {
    serviceRequests: serviceRequests.data || [],
    upcomingPreflights: upcomingPreflights.data || [],
    isLoading: serviceRequests.isLoading,
    isError: serviceRequests.isError,
    error: serviceRequests.error,
    createServiceRequest,
    updateServiceRequest,
    cancelServiceRequest,
  };
}
