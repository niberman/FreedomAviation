// Pricing Engine Calculations
import { Assumptions, ClassCfg, RowInput, RowOutput } from './types';

/**
 * Calculate pricing row with hangar cost logic
 * Hangar cost priority: override > location default > 0
 */
export function calcRow(a: Assumptions, cls: ClassCfg, row: RowInput): RowOutput {
  const final_price = Number(row.custom_price ?? cls.default_price) || 0;
  const labor_cost = cls.labor_hours * a.labor_rate;
  const cfi = a.cfi_allocation;
  const cleaning = a.cleaning_supplies;
  const avionics_db = cls.avionics_db || a.avionics_db_per_ac || 0;
  const consumables = cls.consumables || 0;
  const overhead = a.overhead_per_ac;
  
  // Hangar cost logic: override ?? location default ?? 0
  const hangar_derived = row.hangar_cost ?? row.location?.default_hangar_cost ?? 0;
  
  const cc_fee = Math.round(final_price * (a.card_fee_pct / 100));
  const total_cost = hangar_derived + labor_cost + cfi + cleaning + avionics_db + consumables + overhead + cc_fee;
  const net_revenue = final_price - total_cost;
  const margin_pct = final_price > 0 ? net_revenue / final_price : 0;
  
  return {
    ...row,
    final_price,
    labor_cost,
    cfi,
    cleaning,
    avionics_db,
    consumables,
    overhead,
    cc_fee,
    hangar_derived,
    total_cost,
    net_revenue,
    margin_pct,
  };
}

/**
 * Format number as USD currency
 */
export function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

/**
 * Format percentage with 1 decimal place
 */
export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
