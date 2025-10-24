import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export type Tier = {
  tier_id: string;
  tier_name: string;
  tier_description: string | null;
};
export type HourBand = {
  hour_band_id: string;
  hour_band_label: string;
  min_hours: number;
  max_hours: number | null;
};
export type PriceRow = {
  tier_id: string;
  tier_name: string;
  tier_description: string | null;
  hour_band_id: string;
  hour_band_label: string;
  min_hours: number;
  max_hours: number | null;
  base_price_for_band: number;
  multiplier: number | null;
  credit_multiplier: number | null;
};
export async function loadPricing() {
  const { data: matrix, error } = await supabase
    .from("v_membership_pricing")
    .select("*")
    .order("tier_name")
    .order("min_hours");
  if (error) throw error;
  const { data: locations } = await supabase
    .from("v_locations")
    .select("*")
    .order("name");
  const { data: svcMap } = await supabase
    .from("membership_service_map")
    .select("*");
  const tiers: Record<string, Tier> = {};
  const bands: Record<string, HourBand> = {};
  const grid: Record<string, Record<string, PriceRow>> = {};
  const servicesByBand: Record<string, Record<string, any>> = {};
  for (const r of matrix || []) {
    tiers[r.tier_id] ??= {
      tier_id: r.tier_id,
      tier_name: r.tier_name,
      tier_description: r.tier_description,
    };
    bands[r.hour_band_id] ??= {
      hour_band_id: r.hour_band_id,
      hour_band_label: r.hour_band_label,
      min_hours: r.min_hours,
      max_hours: r.max_hours,
    };
    grid[r.tier_id] ??= {};
    grid[r.tier_id][r.hour_band_id] = r;
  }
  for (const s of svcMap || []) {
    servicesByBand[s.tier_id] ??= {};
    servicesByBand[s.tier_id][s.hour_band_id] = s;
  }
  return {
    tierList: Object.values(tiers),
    bandList: Object.values(bands).sort((a,b)=>a.min_hours-b.min_hours),
    grid,
    locations,
    servicesByBand
  };
}
