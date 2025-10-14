import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { z } from "zod";
import type { Aircraft, AircraftInsert, AircraftUpdate } from "@/lib/types/database";

// Zod schemas for validation
export const aircraftSchema = z.object({
  tail_number: z.string().min(1, "Tail number is required").regex(/^N[0-9]{1,5}[A-Z]{0,2}$/, "Invalid tail number format"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  class: z.string().optional().nullable(),
  hobbs_hours: z.number().min(0).optional().nullable(),
  tach_hours: z.number().min(0).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  base_location: z.string().optional().nullable(),
});

export type AircraftFormData = z.infer<typeof aircraftSchema>;

export function useAircraft(aircraftId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get single aircraft
  const aircraft = useQuery({
    queryKey: ["aircraft", aircraftId],
    queryFn: async (): Promise<Aircraft | null> => {
      if (!aircraftId) return null;
      
      const { data, error } = await supabase
        .from("aircraft")
        .select("*")
        .eq("id", aircraftId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(aircraftId),
  });

  // Get all user's aircraft
  const aircraftList = useQuery({
    queryKey: ["aircraft", "list", user?.id],
    queryFn: async (): Promise<Aircraft[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("aircraft")
        .select("*")
        .eq("owner_id", user.id)
        .order("tail_number");

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(user?.id),
  });

  // Create aircraft mutation
  const createAircraft = useMutation({
    mutationFn: async (input: AircraftFormData) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Validate input
      const validated = aircraftSchema.parse(input);

      const insertData: AircraftInsert = {
        ...validated,
        owner_id: user.id,
      };

      const { data, error } = await supabase
        .from("aircraft")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aircraft"] });
    },
  });

  // Update aircraft mutation
  const updateAircraft = useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: Partial<AircraftFormData> }) => {
      // Validate partial input
      const validated = aircraftSchema.partial().parse(updateData);

      const { data, error } = await supabase
        .from("aircraft")
        .update(validated as AircraftUpdate)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["aircraft", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["aircraft", "list"] });
    },
  });

  // Delete aircraft mutation
  const deleteAircraft = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("aircraft")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aircraft"] });
    },
  });

  return {
    aircraft: aircraft.data,
    aircraftList: aircraftList.data || [],
    isLoading: aircraft.isLoading || aircraftList.isLoading,
    isError: aircraft.isError || aircraftList.isError,
    error: aircraft.error || aircraftList.error,
    createAircraft,
    updateAircraft,
    deleteAircraft,
  };
}
