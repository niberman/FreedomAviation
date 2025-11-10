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
      // Prepare update data - handle empty strings and undefined values
      const preparedData: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(updateData)) {
        // Skip undefined values
        if (value === undefined) {
          continue;
        }
        
        // Convert empty strings to null for nullable fields
        if (value === "") {
          // For nullable fields, set to null
          if (["year", "class", "hobbs_hours", "tach_hours", "image_url", "base_location"].includes(key)) {
            preparedData[key] = null;
          } else if (["make", "model", "tail_number"].includes(key)) {
            // For required string fields, skip empty strings (don't update)
            continue;
          } else {
            preparedData[key] = null;
          }
        } else {
          preparedData[key] = value;
        }
      }

      // If no valid fields to update, throw error
      if (Object.keys(preparedData).length === 0) {
        throw new Error("No valid fields to update");
      }

      // Create a lenient schema for partial updates
      // For string fields that are being updated, allow empty strings to be converted
      const updatePayload: AircraftUpdate = {};
      
      // Handle each field type appropriately
      if ("make" in preparedData && preparedData.make !== null && preparedData.make !== "") {
        updatePayload.make = String(preparedData.make).trim();
        if (updatePayload.make.length === 0) {
          throw new Error("Make cannot be empty");
        }
      }
      if ("model" in preparedData && preparedData.model !== null && preparedData.model !== "") {
        updatePayload.model = String(preparedData.model).trim();
        if (updatePayload.model.length === 0) {
          throw new Error("Model cannot be empty");
        }
      }
      if ("tail_number" in preparedData && preparedData.tail_number !== null && preparedData.tail_number !== "") {
        updatePayload.tail_number = String(preparedData.tail_number).trim().toUpperCase();
      }
      if ("year" in preparedData) {
        if (preparedData.year === null) {
          updatePayload.year = null;
        } else {
          const yearNum = Number(preparedData.year);
          if (isNaN(yearNum)) {
            throw new Error("Year must be a valid number");
          }
          updatePayload.year = yearNum;
        }
      }
      if ("class" in preparedData) {
        updatePayload.class = preparedData.class === null || preparedData.class === "" ? null : String(preparedData.class).trim();
      }
      if ("hobbs_hours" in preparedData) {
        if (preparedData.hobbs_hours === null) {
          updatePayload.hobbs_hours = null;
        } else {
          const hoursNum = Number(preparedData.hobbs_hours);
          if (isNaN(hoursNum) || hoursNum < 0) {
            throw new Error("Hobbs hours must be a valid number >= 0");
          }
          updatePayload.hobbs_hours = hoursNum;
        }
      }
      if ("tach_hours" in preparedData) {
        if (preparedData.tach_hours === null) {
          updatePayload.tach_hours = null;
        } else {
          const hoursNum = Number(preparedData.tach_hours);
          if (isNaN(hoursNum) || hoursNum < 0) {
            throw new Error("Tach hours must be a valid number >= 0");
          }
          updatePayload.tach_hours = hoursNum;
        }
      }
      if ("base_location" in preparedData) {
        updatePayload.base_location = preparedData.base_location === null || preparedData.base_location === "" ? null : String(preparedData.base_location).trim();
      }
      if ("image_url" in preparedData) {
        updatePayload.image_url = preparedData.image_url === null || preparedData.image_url === "" ? null : String(preparedData.image_url).trim();
      }

      // Check if we have anything to update
      if (Object.keys(updatePayload).length === 0) {
        throw new Error("No valid fields to update");
      }

      const { data, error } = await supabase
        .from("aircraft")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error updating aircraft:", error);
        throw new Error(error.message || "Failed to update aircraft");
      }
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all relevant query keys
      queryClient.invalidateQueries({ queryKey: ["aircraft", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["aircraft", "list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/aircraft"] });
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
