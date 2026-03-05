import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// ── Validation schemas ──────────────────────────────────────────────────────

export const assumptionsSchema = z.object({
  id: z.string().optional(),
  labor_rate: z.coerce.number(),
  card_fee_pct: z.coerce.number(),
  cfi_allocation: z.coerce.number(),
  cleaning_supplies: z.coerce.number(),
  overhead_per_ac: z.coerce.number(),
  avionics_db_per_ac: z.coerce.number(),
  updated_at: z.string().optional(),
});

export const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  hangar_cost_monthly: z.coerce.number(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  features: z.any().nullable().optional(),
  active: z.boolean(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const classSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  base_monthly: z.coerce.number(),
  description: z.string().nullable().optional(),
  features: z.any().nullable().optional(),
  sort_order: z.coerce.number().optional(),
  active: z.boolean(),
  created_at: z.string().optional(),
});

export const overrideSchema = z.object({
  id: z.string().optional(),
  aircraft_id: z.string(),
  location_id: z.string().nullable(),
  class_id: z.string().nullable(),
  override_monthly: z.coerce.number().nullable(),
  override_hangar_cost: z.coerce.number().nullable(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Assumptions = z.infer<typeof assumptionsSchema>;
export type Location = z.infer<typeof locationSchema>;
export type PricingClass = z.infer<typeof classSchema>;
export type PricingOverride = z.infer<typeof overrideSchema>;

// ── Data access functions ───────────────────────────────────────────────────

export async function getAssumptions(): Promise<Assumptions | null> {
  const { data, error } = await supabase
    .from('settings_pricing_assumptions')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? assumptionsSchema.parse(data) : null;
}

export async function saveAssumptions(assumptions: Partial<Assumptions>): Promise<Assumptions> {
  const { data: existing, error: fetchError } = await supabase
    .from('settings_pricing_assumptions')
    .select('id')
    .limit(1)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  const payload = existing?.id
    ? { id: existing.id, ...assumptions }
    : assumptions;

  const { data, error } = await supabase
    .from('settings_pricing_assumptions')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('pricing_locations')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data.map((d: Record<string, unknown>) => locationSchema.parse(d));
}

export async function saveLocation(location: Partial<Location>): Promise<Location> {
  const { data, error } = await supabase
    .from('pricing_locations')
    .upsert(location)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getClasses(): Promise<PricingClass[]> {
  const { data, error } = await supabase
    .from('pricing_classes')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data.map((d: Record<string, unknown>) => classSchema.parse(d));
}

export async function saveClass(pricingClass: Partial<PricingClass>): Promise<PricingClass> {
  const { data, error } = await supabase
    .from('pricing_classes')
    .upsert(pricingClass)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOverrides(): Promise<PricingOverride[]> {
  const { data, error } = await supabase
    .from('aircraft_pricing_overrides')
    .select('*');

  if (error) throw error;
  return data.map((d: Record<string, unknown>) => overrideSchema.parse(d));
}

export async function saveOverride(override: PricingOverride): Promise<PricingOverride> {
  const { data, error } = await supabase
    .from('aircraft_pricing_overrides')
    .upsert(override)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function publishSnapshot(payload: { label: string; payload: unknown }): Promise<unknown> {
  const { data, error } = await supabase
    .from('pricing_snapshots')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLatestSnapshot(): Promise<unknown> {
  const { data, error } = await supabase
    .from('pricing_snapshots')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
