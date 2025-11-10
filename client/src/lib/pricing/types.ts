// Pricing Engine Types
export type Assumptions = {
  labor_rate: number;
  card_fee_pct: number;
  cfi_allocation: number;
  cleaning_supplies: number;
  overhead_per_ac: number;
  avionics_db_per_ac: number;
};

export type ClassCfg = {
  id: string;
  name: string;
  default_price: number;
  labor_hours: number;
  avionics_db: number;
  consumables: number;
};

export type LocationRef = {
  id: string;
  name: string;
  slug: string;
  default_hangar_cost: number | null;
};

export type RowInput = {
  tail: string;
  class_name: string;
  custom_price?: number | null;
  hangar_cost?: number | null;
  location?: LocationRef | null;
  has_tks?: boolean | null;
  has_oxygen?: boolean | null;
};

export type RowOutput = RowInput & {
  final_price: number;
  labor_cost: number;
  cfi: number;
  cleaning: number;
  avionics_db: number;
  consumables: number;
  overhead: number;
  cc_fee: number;
  hangar_derived: number;
  total_cost: number;
  net_revenue: number;
  margin_pct: number;
};
