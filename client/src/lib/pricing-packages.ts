export type HoursBand = {
  range: "0-20" | "20-50" | "50+";
  detailsPerMonth: string; // "1", "2", "3–4", "Unlimited"
  serviceFrequency: string; // "Weekly readiness", etc.
  priceMultiplier: number; // 1.0, 1.45, 1.9, 2.2
};

export type Package = {
  id: "class-i" | "class-ii" | "class-iii";
  title: string;
  examples: string[];
  baseMonthly: number; // 0–10 hrs base
  includes: string[]; // always-included bullets
  hours: HoursBand[];
  addons?: { name: string; priceDeltaMonthly: number; bullets: string[] }[];
};

export const ALWAYS_INCLUDED = [
  "Exterior + interior detailing (scaled by hours flown)",
  "Fluids: oil, O₂, TKS (as applicable)",
  "Avionics database updates",
  "Pre-/post-flight readiness checks",
  "Ramp & hangar coordination",
  "Digital owner portal with logs & notifications",
];

const HOURS_BANDS: HoursBand[] = [
  {
    range: "0-20",
    detailsPerMonth: "1",
    serviceFrequency: "Weekly readiness",
    priceMultiplier: 1.0,
  },
  {
    range: "20-50",
    detailsPerMonth: "2",
    serviceFrequency: "Pre-/post-flight cleaning",
    priceMultiplier: 1.45,
  },
  {
    range: "50+",
    detailsPerMonth: "Unlimited",
    serviceFrequency: "After every flight",
    priceMultiplier: 1.9,
  },
];

export const PACKAGES: Package[] = [
  {
    id: "class-i",
    title: "Class I — Basic Piston",
    examples: ["C172", "C182", "Archer", "Cherokee"],
    baseMonthly: 200,
    includes: ALWAYS_INCLUDED,
    hours: HOURS_BANDS,
  },
  {
    id: "class-ii",
    title: "Class II — High-Performance / TAA",
    examples: ["SR20", "SR22", "SR22T", "DA40", "Mooney"],
    baseMonthly: 550,
    includes: ALWAYS_INCLUDED,
    hours: HOURS_BANDS,
  },
  {
    id: "class-iii",
    title: "Class III — Turbine Single / Vision",
    examples: ["Vision Jet", "TBM"],
    baseMonthly: 1000,
    includes: ALWAYS_INCLUDED,
    hours: HOURS_BANDS,
  },
];
