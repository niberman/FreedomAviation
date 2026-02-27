'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const assumptionsSchema = z.object({
  id: z.string().optional(),
  labor_rate: z.coerce.number(),
  card_fee_pct: z.coerce.number(),
  cfi_allocation: z.coerce.number(),
  cleaning_supplies: z.coerce.number(),
  overhead_per_ac: z.coerce.number(),
  avionics_db_per_ac: z.coerce.number(),
  updated_at: z.string().optional(),
});

const locationSchema = z.object({
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

const classSchema = z.object({
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

const overrideSchema = z.object({
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

export function useAssumptions() {
  return useQuery({
    queryKey: ['pricing-assumptions'],
    queryFn: async (): Promise<Assumptions | null> => {
      const { data, error } = await supabase
        .from('settings_pricing_assumptions')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? assumptionsSchema.parse(data) : null;
    },
  });
}

export function useSaveAssumptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assumptions: Partial<Assumptions>) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-assumptions'] });
    },
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ['pricing-locations'],
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from('pricing_locations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data.map((d: Record<string, unknown>) => locationSchema.parse(d));
    },
  });
}

export function useSaveLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: Partial<Location>) => {
      const { data, error } = await supabase
        .from('pricing_locations')
        .upsert(location)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-locations'] });
    },
  });
}

export function useClasses() {
  return useQuery({
    queryKey: ['pricing-classes'],
    queryFn: async (): Promise<PricingClass[]> => {
      const { data, error } = await supabase
        .from('pricing_classes')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data.map((d: Record<string, unknown>) => classSchema.parse(d));
    },
  });
}

export function useSaveClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pricingClass: Partial<PricingClass>) => {
      const { data, error } = await supabase
        .from('pricing_classes')
        .upsert(pricingClass)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-classes'] });
    },
  });
}

export function useOverrides() {
  return useQuery({
    queryKey: ['pricing-overrides'],
    queryFn: async (): Promise<PricingOverride[]> => {
      const { data, error } = await supabase
        .from('aircraft_pricing_overrides')
        .select('*');

      if (error) throw error;
      return data.map((d: Record<string, unknown>) => overrideSchema.parse(d));
    },
  });
}

export function useSaveOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (override: PricingOverride) => {
      const { data, error } = await supabase
        .from('aircraft_pricing_overrides')
        .upsert(override)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-overrides'] });
    },
  });
}

export function usePublishSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { label: string; payload: unknown }) => {
      const { data, error } = await supabase
        .from('pricing_snapshots')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-snapshots'] });
    },
  });
}

export function useLatestSnapshot() {
  return useQuery({
    queryKey: ['pricing-snapshots', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_snapshots')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}
