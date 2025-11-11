/**
 * Enhanced Unified Pricing Configuration
 * Single source of truth combining best features from all pricing models
 * 
 * This hybrid system combines:
 * - Strong typing and helper functions from unified-pricing.ts
 * - Addons/extras structure from pricing-packages.ts
 * - Realistic market pricing and clean patterns from simple-pricing-calculator.tsx
 */

// ============================================================================
// Core Type Definitions
// ============================================================================

export type PricingTier = 'light' | 'performance' | 'turbine';
export type HoursRange = '0-20' | '20-50' | '50+';

export interface PricingFeature {
  name: string;
  description?: string;
  tier?: PricingTier[]; // If specified, only available for these tiers
}

export interface AddonConfig {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  applicableTiers?: PricingTier[]; // If not specified, available for all tiers
  features: string[];
}

export interface HoursBandConfig {
  range: HoursRange;
  label: string;
  avgHours: number;
  detailsPerMonth: string;
  serviceFrequency: string;
  multiplier: number;
  description?: string;
}

export interface TierConfig {
  id: PricingTier;
  name: string;
  title: string;
  description: string;
  examples: string[];
  baseMonthly: number;
  hoursBands: HoursBandConfig[];
  premiumFeatures?: PricingFeature[];
}

export interface PricingSelection {
  tier: PricingTier;
  hoursRange: HoursRange;
  monthlyPrice: number;
  addons?: string[];
  hangarCost?: number;
  totalMonthly?: number;
}

export interface PricingSummary {
  tierConfig: TierConfig;
  hoursBandConfig: HoursBandConfig;
  baseMonthly: number;
  hangarCost: number;
  addonsCost: number;
  subtotal: number;
  discount?: {
    reason: string;
    amount: number;
    percentage: number;
  };
  totalMonthly: number;
  inclusions: PricingFeature[];
  addons: AddonConfig[];
}

// ============================================================================
// Configuration Data
// ============================================================================

/**
 * Standard hours bands applied across all aircraft tiers
 * Multipliers reflect increased service frequency and detailing needs
 */
export const HOURS_BANDS: HoursBandConfig[] = [
  {
    range: '0-20',
    label: '0-20 hrs/mo',
    avgHours: 10,
    detailsPerMonth: '1',
    serviceFrequency: 'Weekly readiness check',
    multiplier: 1.0,
    description: 'Light usage - perfect for weekend flyers',
  },
  {
    range: '20-50',
    label: '20-50 hrs/mo',
    avgHours: 35,
    detailsPerMonth: '2',
    serviceFrequency: 'Pre-/post-flight cleaning',
    multiplier: 1.45,
    description: 'Moderate usage - ideal for regular business travel',
  },
  {
    range: '50+',
    label: '50+ hrs/mo',
    avgHours: 60,
    detailsPerMonth: 'Unlimited',
    serviceFrequency: 'After every flight',
    multiplier: 1.9,
    description: 'Heavy usage - for frequent flyers and charter operations',
  },
];

/**
 * Core features included in all tiers at base price
 * These are the foundational services every member receives
 */
export const CORE_FEATURES: PricingFeature[] = [
  { 
    name: 'Climate-controlled hangar storage', 
    description: 'Premium hangar at Centennial (KAPA)' 
  },
  { 
    name: 'Pre & post-flight preparation', 
    description: 'Aircraft readiness checks and walkarounds' 
  },
  { 
    name: 'Professional cleaning & detailing', 
    description: 'Interior and exterior, scaled by usage' 
  },
  { 
    name: 'Fluid top-offs & replenishment', 
    description: 'Oil, oxygen, TKS (as applicable)' 
  },
  { 
    name: 'Avionics database updates', 
    description: 'Always current navigation data' 
  },
  { 
    name: 'Digital owner portal access', 
    description: 'Real-time logs, photos, and notifications' 
  },
  { 
    name: 'Maintenance coordination', 
    description: 'Scheduling, tracking, and vendor management' 
  },
  { 
    name: 'Ramp & FBO coordination', 
    description: 'Arrival/departure logistics' 
  },
];

/**
 * Optional addons that enhance the base service package
 * Can be added to any tier for additional monthly cost
 */
export const AVAILABLE_ADDONS: AddonConfig[] = [
  {
    id: 'concierge',
    name: '24/7 Concierge Service',
    description: 'Round-the-clock dedicated support for urgent requests',
    monthlyPrice: 500,
    features: [
      '24/7 phone support',
      'After-hours aircraft preparation',
      'Priority scheduling for services',
      'Emergency coordination',
    ],
  },
  {
    id: 'premium-detail',
    name: 'Premium Detailing Package',
    description: 'Enhanced cleaning with ceramic coating and leather treatment',
    monthlyPrice: 350,
    features: [
      'Ceramic coating maintenance',
      'Leather conditioning',
      'Paint correction touches',
      'Engine bay detailing',
    ],
  },
  {
    id: 'trip-planning',
    name: 'Trip Planning Service',
    description: 'Professional flight planning and weather briefings',
    monthlyPrice: 250,
    features: [
      'Custom flight planning',
      'Weather briefings',
      'FBO arrangements',
      'Hotel and ground transport coordination',
    ],
  },
  {
    id: 'multi-aircraft',
    name: 'Multi-Aircraft Management',
    description: 'Manage additional aircraft at discounted rate',
    monthlyPrice: 400,
    applicableTiers: ['performance', 'turbine'],
    features: [
      '50% discount on 2nd aircraft',
      'Unified billing and reporting',
      'Fleet-wide coordination',
    ],
  },
];

/**
 * Aircraft tier configurations
 * Pricing reflects aircraft complexity, systems, and typical service requirements
 */
export const PRICING_TIERS: TierConfig[] = [
  {
    id: 'light',
    name: 'Light Aircraft',
    title: 'Class I — Light Aircraft',
    description: 'For light piston single-engine aircraft',
    examples: ['C172', 'C182', 'Archer', 'Cherokee', 'Skyhawk'],
    baseMonthly: 850,
    hoursBands: HOURS_BANDS,
  },
  {
    id: 'performance',
    name: 'High Performance',
    title: 'Class II — High Performance',
    description: 'For high-performance and technologically advanced aircraft',
    examples: ['SR20', 'SR22', 'SR22T', 'DA40', 'Mooney', 'Bonanza'],
    baseMonthly: 1650,
    hoursBands: HOURS_BANDS,
    premiumFeatures: [
      { name: 'Advanced avionics support', description: 'G1000/Perspective systems' },
      { name: 'Turbo system monitoring', description: 'For turbocharged models' },
    ],
  },
  {
    id: 'turbine',
    name: 'Turbine',
    title: 'Class III — Turbine',
    description: 'For turbine singles and light jets',
    examples: ['TBM', 'Vision Jet', 'PC-12', 'Meridian'],
    baseMonthly: 3200,
    hoursBands: HOURS_BANDS,
    premiumFeatures: [
      { name: 'Turbine engine monitoring', description: 'ITT, torque tracking' },
      { name: 'Enhanced systems support', description: 'Complex avionics and autopilot' },
      { name: 'Jet-specific detailing', description: 'Specialized cleaning products' },
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get tier configuration by ID
 */
export function getTierById(id: PricingTier): TierConfig | undefined {
  return PRICING_TIERS.find(tier => tier.id === id);
}

/**
 * Get hours band configuration by range
 */
export function getHoursBandByRange(range: HoursRange): HoursBandConfig | undefined {
  return HOURS_BANDS.find(band => band.range === range);
}

/**
 * Get addon configuration by ID
 */
export function getAddonById(id: string): AddonConfig | undefined {
  return AVAILABLE_ADDONS.find(addon => addon.id === id);
}

/**
 * Calculate base monthly price before addons and hangar
 */
export function calculateMonthlyPrice(
  tierId: PricingTier,
  hoursRange: HoursRange
): number {
  const tier = getTierById(tierId);
  const hoursBand = getHoursBandByRange(hoursRange);
  
  if (!tier || !hoursBand) return 0;
  
  return Math.round(tier.baseMonthly * hoursBand.multiplier);
}

/**
 * Calculate total cost including addons
 */
export function calculateTotalWithAddons(
  tierId: PricingTier,
  hoursRange: HoursRange,
  addonIds: string[] = [],
  hangarCost: number = 0
): number {
  const basePrice = calculateMonthlyPrice(tierId, hoursRange);
  const addonsTotal = addonIds.reduce((total, addonId) => {
    const addon = getAddonById(addonId);
    if (!addon) return total;
    
    // Check if addon is applicable to this tier
    if (addon.applicableTiers && !addon.applicableTiers.includes(tierId)) {
      return total;
    }
    
    return total + addon.monthlyPrice;
  }, 0);
  
  return basePrice + addonsTotal + hangarCost;
}

/**
 * Get applicable addons for a specific tier
 */
export function getApplicableAddons(tierId: PricingTier): AddonConfig[] {
  return AVAILABLE_ADDONS.filter(addon => 
    !addon.applicableTiers || addon.applicableTiers.includes(tierId)
  );
}

/**
 * Recommend tier based on aircraft make/model
 * Uses intelligent pattern matching to suggest appropriate tier
 */
export function recommendTierByAircraft(make: string, model: string): PricingTier {
  const combined = `${make} ${model}`.toLowerCase();
  
  // Turbine aircraft patterns
  const turbinePatterns = [
    'vision', 'jet', 'tbm', 'pc-12', 'pilatus', 'meridian',
    'mustang', 'citation', 'phenom', 'eclipse'
  ];
  
  if (turbinePatterns.some(pattern => combined.includes(pattern))) {
    return 'turbine';
  }
  
  // High-performance aircraft patterns
  const performancePatterns = [
    'sr20', 'sr22', 'cirrus', 'da40', 'da42', 'da62', 'diamond',
    'mooney', 'bonanza', 'baron', 'ttx', 'columbia', 'corvalis'
  ];
  
  if (performancePatterns.some(pattern => combined.includes(pattern))) {
    return 'performance';
  }
  
  // Default to light aircraft
  return 'light';
}

/**
 * Recommend hours band based on average monthly flight hours
 */
export function recommendHoursBand(avgMonthlyHours?: number): HoursRange {
  if (!avgMonthlyHours) return '20-50'; // Default to middle tier
  
  if (avgMonthlyHours >= 50) return '50+';
  if (avgMonthlyHours >= 20) return '20-50';
  return '0-20';
}

/**
 * Calculate multi-aircraft discount
 */
export function calculateMultiAircraftDiscount(
  aircraftCount: number,
  baseMonthly: number
): { discount: number; finalPrice: number } {
  if (aircraftCount <= 1) {
    return { discount: 0, finalPrice: baseMonthly };
  }
  
  // 15% discount on 2nd aircraft, 25% on 3rd+
  let totalDiscount = 0;
  if (aircraftCount >= 2) totalDiscount += baseMonthly * 0.15;
  if (aircraftCount >= 3) totalDiscount += baseMonthly * 0.10 * (aircraftCount - 2);
  
  return {
    discount: Math.round(totalDiscount),
    finalPrice: Math.round(baseMonthly - totalDiscount),
  };
}

/**
 * Create a complete pricing selection
 */
export function createPricingSelection(
  tier: PricingTier,
  hoursRange: HoursRange,
  addonIds: string[] = [],
  hangarCost: number = 0
): PricingSelection {
  const monthlyPrice = calculateMonthlyPrice(tier, hoursRange);
  const totalMonthly = calculateTotalWithAddons(tier, hoursRange, addonIds, hangarCost);
  
  return {
    tier,
    hoursRange,
    monthlyPrice,
    addons: addonIds,
    hangarCost,
    totalMonthly,
  };
}

/**
 * Get complete pricing summary with all details
 */
export function getPricingSummary(
  tierId: PricingTier,
  hoursRange: HoursRange,
  addonIds: string[] = [],
  hangarCost: number = 0,
  discountConfig?: { reason: string; percentage: number }
): PricingSummary | null {
  const tierConfig = getTierById(tierId);
  const hoursBandConfig = getHoursBandByRange(hoursRange);
  
  if (!tierConfig || !hoursBandConfig) return null;
  
  const baseMonthly = calculateMonthlyPrice(tierId, hoursRange);
  const selectedAddons = addonIds
    .map(id => getAddonById(id))
    .filter((addon): addon is AddonConfig => addon !== undefined);
  
  const addonsCost = selectedAddons.reduce((sum, addon) => sum + addon.monthlyPrice, 0);
  const subtotal = baseMonthly + hangarCost + addonsCost;
  
  let discount = undefined;
  let totalMonthly = subtotal;
  
  if (discountConfig) {
    const discountAmount = Math.round(subtotal * (discountConfig.percentage / 100));
    discount = {
      reason: discountConfig.reason,
      amount: discountAmount,
      percentage: discountConfig.percentage,
    };
    totalMonthly = subtotal - discountAmount;
  }
  
  // Combine core features with tier-specific premium features
  const inclusions = [
    ...CORE_FEATURES,
    ...(tierConfig.premiumFeatures || []),
  ];
  
  return {
    tierConfig,
    hoursBandConfig,
    baseMonthly,
    hangarCost,
    addonsCost,
    subtotal,
    discount,
    totalMonthly,
    inclusions,
    addons: selectedAddons,
  };
}

/**
 * Get all available features for a tier
 */
export function getAllFeatures(tierId: PricingTier): PricingFeature[] {
  const tier = getTierById(tierId);
  if (!tier) return CORE_FEATURES;
  
  return [
    ...CORE_FEATURES,
    ...(tier.premiumFeatures || []),
  ];
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/**
 * Get pricing table for a specific tier across all hours bands
 */
export function getPricingTable(tierId: PricingTier): Array<{
  range: HoursRange;
  label: string;
  price: number;
  formatted: string;
}> {
  return HOURS_BANDS.map(band => ({
    range: band.range,
    label: band.label,
    price: calculateMonthlyPrice(tierId, band.range),
    formatted: formatPrice(calculateMonthlyPrice(tierId, band.range)),
  }));
}

// ============================================================================
// Type Re-exports (constants are already exported above)
// ============================================================================

// Type exports for external use
export type {
  PricingTier,
  HoursRange,
  PricingFeature,
  AddonConfig,
  HoursBandConfig,
  TierConfig,
  PricingSelection,
  PricingSummary,
};
