/**
 * Marketing tier configuration and selection logic
 * Maps feature-based pricing to customer-friendly tiers
 */

import type { AircraftFeatures, SizeClass } from './aircraftConfig';
import type { PricingBreakdown } from './pricingEngine';
import { formatCurrency, roundToNearestPricingIncrement } from './pricingEngine';

export type TierId = 'HANGAR_BASIC' | 'MANAGED' | 'TURBO' | 'TURBINE' | 'JET';

export interface TierResult {
  tierId: TierId;
  tierDisplayName: string;
  subtitle: string;
  bulletPoints: string[];
  fromPriceDisplay: string;
}

// Configuration for hours ranges
export const HOURS_CONFIG = {
  TURBO_MIN_HOURS: 15,
  BASIC_MAX_HOURS: 10,
  MANAGED_MAX_HOURS: 15,
} as const;

// Tier configuration with marketing copy
export const TIER_CONFIG: Record<TierId, {
  displayName: string;
  subtitleTemplate: string;
  baseBulletPoints: string[];
  fromPriceAnchor: number; // Typical "from" price for marketing
}> = {
  HANGAR_BASIC: {
    displayName: 'Hangar & Basic Care',
    subtitleTemplate: 'For light-use aircraft owners',
    baseBulletPoints: [
      'Secure hangar at Centennial (KAPA)',
      'Monthly aircraft inspection',
      'Basic cleaning & care',
      'Flight tracking & scheduling',
      'Owner portal access',
    ],
    fromPriceAnchor: 1200,
  },
  
  MANAGED: {
    displayName: 'Managed Hangar',
    subtitleTemplate: 'For active piston aircraft owners',
    baseBulletPoints: [
      'Premium hangar space',
      'Comprehensive maintenance tracking',
      'Pre/post-flight inspections',
      'Interior & exterior detailing',
      'Fuel management & coordination',
      'Scheduling optimization',
    ],
    fromPriceAnchor: 1850,
  },
  
  TURBO: {
    displayName: 'Turbo Membership',
    subtitleTemplate: 'For high-performance turbocharged aircraft',
    baseBulletPoints: [
      'Executive hangar placement',
      'Priority maintenance scheduling',
      'Enhanced pre-flight preparation',
      'Premium detailing service',
      'Concierge trip planning',
      // TKS and O2 bullets added dynamically
    ],
    fromPriceAnchor: 3000,
  },
  
  TURBINE: {
    displayName: 'Turbine Concierge',
    subtitleTemplate: 'Full-service turboprop management',
    baseBulletPoints: [
      'Prime hangar location',
      'Dedicated aircraft manager',
      'Complete flight department services',
      'Comprehensive maintenance oversight',
      'Trip planning & international handling',
      'Crew coordination services',
    ],
    fromPriceAnchor: 5500,
  },
  
  JET: {
    displayName: 'Jet Concierge',
    subtitleTemplate: 'White-glove jet management',
    baseBulletPoints: [
      'Premier hangar facilities',
      'Dedicated management team',
      'Part 135 charter coordination',
      'Global trip support',
      'Complete maintenance programs',
      'Crew management & training',
    ],
    fromPriceAnchor: 8500,
  },
};

/**
 * Select appropriate tier based on aircraft features, hours, and pricing
 */
export function selectTier(
  features: AircraftFeatures,
  monthlyHours: number,
  pricing: PricingBreakdown
): TierResult {
  let tierId: TierId;
  
  // Tier selection logic based on features and hours
  if (features.sizeClass === 'light_jet') {
    tierId = 'JET';
  } else if (features.sizeClass === 'turboprop') {
    tierId = 'TURBINE';
  } else if (
    features.sizeClass === 'hp_piston' &&
    (features.hasTKS || features.hasOxygen || features.hasTurbo) &&
    monthlyHours >= HOURS_CONFIG.TURBO_MIN_HOURS
  ) {
    tierId = 'TURBO';
  } else if (
    features.sizeClass === 'small_piston' &&
    !features.hasTKS &&
    !features.hasOxygen &&
    monthlyHours <= HOURS_CONFIG.BASIC_MAX_HOURS
  ) {
    tierId = 'HANGAR_BASIC';
  } else {
    tierId = 'MANAGED';
  }
  
  const config = TIER_CONFIG[tierId];
  
  // Build bullet points with dynamic content
  const bulletPoints = [...config.baseBulletPoints];
  
  // Add feature-specific bullets
  if (features.hasTKS && tierId === 'TURBO') {
    bulletPoints.push('TKS fluid servicing & top-offs included');
  }
  
  if (features.hasOxygen && (tierId === 'TURBO' || tierId === 'TURBINE' || tierId === 'JET')) {
    bulletPoints.push('Oxygen system management & refills');
  }
  
  if (features.hasPressurization && (tierId === 'TURBINE' || tierId === 'JET')) {
    bulletPoints.push('Pressurization system monitoring');
  }
  
  // Generate subtitle with hours range
  let subtitle = config.subtitleTemplate;
  if (tierId === 'TURBO') {
    subtitle = `${config.subtitleTemplate} flying ${HOURS_CONFIG.TURBO_MIN_HOURS}+ hours/month`;
  } else if (tierId === 'MANAGED') {
    subtitle = `${config.subtitleTemplate} flying 5-${HOURS_CONFIG.MANAGED_MAX_HOURS} hours/month`;
  } else if (tierId === 'HANGAR_BASIC') {
    subtitle = `${config.subtitleTemplate} flying under ${HOURS_CONFIG.BASIC_MAX_HOURS} hours/month`;
  }
  
  // Determine from price display
  let fromPrice: number;
  
  if (tierId === 'TURBO') {
    // For Turbo tier, normalize to target price
    fromPrice = config.fromPriceAnchor;
  } else {
    // Use actual calculated price or anchor, whichever is lower
    fromPrice = Math.min(
      roundToNearestPricingIncrement(pricing.totalMonthly),
      config.fromPriceAnchor
    );
  }
  
  return {
    tierId,
    tierDisplayName: config.displayName,
    subtitle,
    bulletPoints,
    fromPriceDisplay: `From ~${formatCurrency(fromPrice)}/mo`,
  };
}

/**
 * Get hangar footprint display label
 */
export function getHangarFootprintLabel(footprintClass: string): string {
  const labels: Record<string, string> = {
    piston_single: 'Single Engine Piston',
    piston_hp: 'High Performance',
    turboprop: 'Turboprop',
    jet_light: 'Light Jet',
  };
  
  return labels[footprintClass] || footprintClass;
}

/**
 * Get size class display label
 */
export function getSizeClassLabel(sizeClass: SizeClass): string {
  const labels: Record<SizeClass, string> = {
    small_piston: 'Light Aircraft',
    hp_piston: 'High Performance',
    turboprop: 'Turboprop',
    light_jet: 'Light Jet',
  };
  
  return labels[sizeClass];
}
