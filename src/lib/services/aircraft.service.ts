import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import type { Aircraft, AircraftInsert, AircraftUpdate } from '@shared/database-types';

// ── Validation schemas ──────────────────────────────────────────────────────

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

/** Shape of each aircraft item returned by GET /api/aircraft */
export interface StaffAircraftListItem {
  id: string;
  tail_number?: string;
  make?: string;
  model?: string;
  class?: string;
  base_location?: string;
  owner_id?: string;
  owner?: { full_name?: string; email?: string };
}

// ── Data access functions ───────────────────────────────────────────────────

/** Fetch a single aircraft by ID */
export async function getAircraftById(id: string): Promise<Aircraft | null> {
  const { data, error } = await supabase
    .from('aircraft')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/** Fetch all aircraft owned by a user */
export async function getAircraftByOwner(ownerId: string): Promise<Aircraft[]> {
  const { data, error } = await supabase
    .from('aircraft')
    .select('*')
    .eq('owner_id', ownerId)
    .order('tail_number');

  if (error) throw error;
  return data || [];
}

/** Create a new aircraft with validation */
export async function createAircraft(input: AircraftFormData, ownerId: string): Promise<Aircraft> {
  const validated = aircraftSchema.parse(input);

  const insertData: AircraftInsert = {
    ...Object.fromEntries(
      Object.entries(validated).map(([k, v]) => [k, v === null ? undefined : v])
    ) as Omit<AircraftInsert, 'owner_id'>,
    owner_id: ownerId,
  };

  const { data, error } = await supabase
    .from('aircraft')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Prepare update payload with field-level validation, then persist */
export async function updateAircraft(
  id: string,
  updateData: Partial<AircraftFormData>,
): Promise<Aircraft> {
  const updatePayload = prepareAircraftUpdatePayload(updateData);

  const { data, error } = await supabase
    .from('aircraft')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase error updating aircraft:', error);
    throw new Error(error.message || 'Failed to update aircraft');
  }
  return data;
}

/** Delete an aircraft by ID */
export async function deleteAircraft(id: string): Promise<void> {
  const { error } = await supabase
    .from('aircraft')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Internal helpers ────────────────────────────────────────────────────────

/**
 * Build a validated update payload from raw form data.
 * Handles empty-string → null coercion, required-field protection,
 * and type casting for numeric/boolean fields.
 */
function prepareAircraftUpdatePayload(updateData: Partial<AircraftFormData>): AircraftUpdate {
  const preparedData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updateData)) {
    if (value === undefined) continue;

    if (value === '') {
      // Nullable fields: coerce empty string to null
      if (['year', 'class', 'hobbs_hours', 'tach_hours', 'image_url', 'base_location', 'has_tks', 'has_oxygen'].includes(key)) {
        preparedData[key] = null;
      } else if (['make', 'model', 'tail_number'].includes(key)) {
        // Required fields: skip empty strings
        continue;
      } else {
        preparedData[key] = null;
      }
    } else {
      preparedData[key] = value;
    }
  }

  if (Object.keys(preparedData).length === 0) {
    throw new Error('No valid fields to update');
  }

  const updatePayload: AircraftUpdate = {};

  if ('make' in preparedData && preparedData.make !== null && preparedData.make !== '') {
    updatePayload.make = String(preparedData.make).trim();
    if (updatePayload.make.length === 0) throw new Error('Make cannot be empty');
  }
  if ('model' in preparedData && preparedData.model !== null && preparedData.model !== '') {
    updatePayload.model = String(preparedData.model).trim();
    if (updatePayload.model.length === 0) throw new Error('Model cannot be empty');
  }
  if ('tail_number' in preparedData && preparedData.tail_number !== null && preparedData.tail_number !== '') {
    updatePayload.tail_number = String(preparedData.tail_number).trim().toUpperCase();
  }
  if ('year' in preparedData) {
    if (preparedData.year === null) {
      updatePayload.year = null;
    } else {
      const yearNum = Number(preparedData.year);
      if (isNaN(yearNum)) throw new Error('Year must be a valid number');
      updatePayload.year = yearNum;
    }
  }
  if ('class' in preparedData) {
    updatePayload.class = preparedData.class === null || preparedData.class === '' ? null : String(preparedData.class).trim();
  }
  if ('hobbs_hours' in preparedData) {
    if (preparedData.hobbs_hours === null) {
      updatePayload.hobbs_hours = null;
    } else {
      const hoursNum = Number(preparedData.hobbs_hours);
      if (isNaN(hoursNum) || hoursNum < 0) throw new Error('Hobbs hours must be a valid number >= 0');
      updatePayload.hobbs_hours = hoursNum;
    }
  }
  if ('tach_hours' in preparedData) {
    if (preparedData.tach_hours === null) {
      updatePayload.tach_hours = null;
    } else {
      const hoursNum = Number(preparedData.tach_hours);
      if (isNaN(hoursNum) || hoursNum < 0) throw new Error('Tach hours must be a valid number >= 0');
      updatePayload.tach_hours = hoursNum;
    }
  }
  if ('base_location' in preparedData) {
    updatePayload.base_location = preparedData.base_location === null || preparedData.base_location === '' ? null : String(preparedData.base_location).trim();
  }
  if ('image_url' in preparedData) {
    updatePayload.image_url = preparedData.image_url === null || preparedData.image_url === '' ? null : String(preparedData.image_url).trim();
  }
  if ('has_tks' in preparedData) {
    updatePayload.has_tks = preparedData.has_tks === null ? null : Boolean(preparedData.has_tks);
  }
  if ('has_oxygen' in preparedData) {
    updatePayload.has_oxygen = preparedData.has_oxygen === null ? null : Boolean(preparedData.has_oxygen);
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new Error('No valid fields to update');
  }

  return updatePayload;
}
