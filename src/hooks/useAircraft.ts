import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import type { Aircraft, AircraftInsert, AircraftUpdate } from "@shared/database-types";

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
  has_tks: z.boolean().optional().nullable(),
  has_oxygen: z.boolean().optional().nullable(),
});

export type AircraftFormData = z.infer<typeof aircraftSchema>;

/** Staff: all aircraft via API route (requires staff role on server) */
export function useStaffAircraftList() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['/api/aircraft', session?.access_token],
    queryFn: async () => {
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      const response = await fetch('/api/aircraft', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching aircraft:', errorText);
        throw new Error(`Failed to fetch aircraft: ${response.status}`);
      }

      const data = await response.json();
      return data.aircraft || [];
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/** Staff: table-shaped list derived from useStaffAircraftList */
export function useAircraftTable() {
  const { data: aircraft = [], ...rest } = useStaffAircraftList();

  const aircraftFull = aircraft.map((ac: { id: string; tail_number?: string; make?: string; model?: string; class?: string; base_location?: string; owner_id?: string; owner?: { full_name?: string; email?: string } }) => {
    const ownerRecord = ac.owner || null;
    const ownerName = ownerRecord?.full_name || ownerRecord?.email || null;

    return {
      id: ac.id,
      tailNumber: ac.tail_number || '',
      make: ac.make || 'N/A',
      model: ac.model || '',
      class: ac.class || 'Unknown',
      baseAirport: ac.base_location || 'KAPA',
      owner: ownerName || 'Unassigned',
      ownerId: ac.owner_id ?? null,
      ownerEmail: ownerRecord?.email ?? null,
    };
  });

  return { aircraftFull, ...rest };
}

/** Owner: single aircraft, owner's list, and CRUD mutations (Supabase direct) */
export function useAircraft(aircraftId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const createAircraft = useMutation({
    mutationFn: async (input: AircraftFormData) => {
      if (!user?.id) throw new Error("User not authenticated");

      const validated = aircraftSchema.parse(input);

      const insertData: AircraftInsert = {
        ...Object.fromEntries(
          Object.entries(validated).map(([k, v]) => [k, v === null ? undefined : v])
        ) as Omit<AircraftInsert, 'owner_id'>,
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

  const updateAircraft = useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: Partial<AircraftFormData> }) => {
      const preparedData: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(updateData)) {
        if (value === undefined) continue;

        if (value === "") {
          if (["year", "class", "hobbs_hours", "tach_hours", "image_url", "base_location", "has_tks", "has_oxygen"].includes(key)) {
            preparedData[key] = null;
          } else if (["make", "model", "tail_number"].includes(key)) {
            continue;
          } else {
            preparedData[key] = null;
          }
        } else {
          preparedData[key] = value;
        }
      }

      if (Object.keys(preparedData).length === 0) {
        throw new Error("No valid fields to update");
      }

      const updatePayload: AircraftUpdate = {};

      if ("make" in preparedData && preparedData.make !== null && preparedData.make !== "") {
        updatePayload.make = String(preparedData.make).trim();
        if (updatePayload.make.length === 0) throw new Error("Make cannot be empty");
      }
      if ("model" in preparedData && preparedData.model !== null && preparedData.model !== "") {
        updatePayload.model = String(preparedData.model).trim();
        if (updatePayload.model.length === 0) throw new Error("Model cannot be empty");
      }
      if ("tail_number" in preparedData && preparedData.tail_number !== null && preparedData.tail_number !== "") {
        updatePayload.tail_number = String(preparedData.tail_number).trim().toUpperCase();
      }
      if ("year" in preparedData) {
        if (preparedData.year === null) {
          updatePayload.year = null;
        } else {
          const yearNum = Number(preparedData.year);
          if (isNaN(yearNum)) throw new Error("Year must be a valid number");
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
          if (isNaN(hoursNum) || hoursNum < 0) throw new Error("Hobbs hours must be a valid number >= 0");
          updatePayload.hobbs_hours = hoursNum;
        }
      }
      if ("tach_hours" in preparedData) {
        if (preparedData.tach_hours === null) {
          updatePayload.tach_hours = null;
        } else {
          const hoursNum = Number(preparedData.tach_hours);
          if (isNaN(hoursNum) || hoursNum < 0) throw new Error("Tach hours must be a valid number >= 0");
          updatePayload.tach_hours = hoursNum;
        }
      }
      if ("base_location" in preparedData) {
        updatePayload.base_location = preparedData.base_location === null || preparedData.base_location === "" ? null : String(preparedData.base_location).trim();
      }
      if ("image_url" in preparedData) {
        updatePayload.image_url = preparedData.image_url === null || preparedData.image_url === "" ? null : String(preparedData.image_url).trim();
      }
      if ("has_tks" in preparedData) {
        updatePayload.has_tks = preparedData.has_tks === null ? null : Boolean(preparedData.has_tks);
      }
      if ("has_oxygen" in preparedData) {
        updatePayload.has_oxygen = preparedData.has_oxygen === null ? null : Boolean(preparedData.has_oxygen);
      }

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
      queryClient.invalidateQueries({ queryKey: ["aircraft", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["aircraft", "list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/aircraft"] });
    },
  });

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
