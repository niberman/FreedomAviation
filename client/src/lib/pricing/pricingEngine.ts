/**
 * Feature-based pricing engine for Freedom Aviation
 * All prices are in USD per month
 */

import type { AircraftFeatures, ComplexityBand, HangarFootprintClass, SizeClass } from './aircraftConfig';
import { deriveComplexityBand } from './aircraftConfig';

// Hangar fee configuration by footprint class
export const HANGAR_FEE_BY_FOOTPRINT: Record<HangarFootprintClass, number> = {
  piston_single: 700,
  piston_hp: 900,
  turboprop: 2000,
  jet_light: 4000,
} as const;

// Base membership fee configuration by size class and complexity
export const BASE_MEMBERSHIP_FEE: Record<SizeClass, Record<ComplexityBand, number>> = {
  small_piston: { low: 300, medium: 400, high: 500 },
  hp_piston:    { low: 500, medium: 650, high: 800 },
  turboprop:    { low: 1000, medium: 1200, high: 1500 },
  light_jet:    { low: 1500, medium: 1800, high: 2200 },
} as const;

// Base operations labor rate by size class (per hour)
export const BASE_OPS_LABOR_RATE: Record<SizeClass, number> = {
  small_piston: 5,
  hp_piston: 7,
  turboprop: 12,
  light_jet: 18,
} as const;

// Consumables unit rates (per relative unit)
export const CONSUMABLE_UNIT_RATE = {
  tks: 4,     // per unit of TKS per hour
  oxygen: 3,  // per unit of oxygen per hour
  oil: 1,     // per unit of oil per hour
} as const;

// Pricing input interface
export interface PricingInput {
  aircraftFeatures: AircraftFeatures;
  monthlyHours: number;
}

// Pricing breakdown interface
export interface PricingBreakdown {
  hangarFee: number;
  baseMembershipFee: number;
  hourlyLaborRate: number;
  hourlyConsumablesRate: number;
  opsRatePerHour: number;
  hours: number;
  opsTotal: number;
  totalMonthly: number;
}

/**
 * Calculate consumables rate per hour based on aircraft features
 */
export function getConsumablesRate(features: AircraftFeatures): number {
  const { tksPerHour, oxygenPerHour, oilPerHour } = features.consumablesProfile;
  
  return (
    tksPerHour * CONSUMABLE_UNIT_RATE.tks +
    oxygenPerHour * CONSUMABLE_UNIT_RATE.oxygen +
    oilPerHour * CONSUMABLE_UNIT_RATE.oil
  );
}

/**
 * Calculate monthly pricing based on aircraft features and hours
 */
export function calculatePricing(input: PricingInput): PricingBreakdown {
  const { aircraftFeatures, monthlyHours } = input;
  
  // 1. Hangar fee based on footprint
  const hangarFee = HANGAR_FEE_BY_FOOTPRINT[aircraftFeatures.hangarFootprintClass];
  
  // 2. Base membership fee based on size and complexity
  const complexityBand = deriveComplexityBand(aircraftFeatures);
  const baseMembershipFee = BASE_MEMBERSHIP_FEE[aircraftFeatures.sizeClass][complexityBand];
  
  // 3. Hourly labor rate based on size class
  const hourlyLaborRate = BASE_OPS_LABOR_RATE[aircraftFeatures.sizeClass];
  
  // 4. Hourly consumables rate based on features
  const hourlyConsumablesRate = getConsumablesRate(aircraftFeatures);
  
  // 5. Total operations rate per hour
  const opsRatePerHour = hourlyLaborRate + hourlyConsumablesRate;
  
  // 6. Operations total
  const opsTotal = opsRatePerHour * monthlyHours;
  
  // 7. Total monthly cost
  const totalMonthly = hangarFee + baseMembershipFee + opsTotal;
  
  return {
    hangarFee,
    baseMembershipFee,
    hourlyLaborRate,
    hourlyConsumablesRate,
    opsRatePerHour,
    hours: monthlyHours,
    opsTotal,
    totalMonthly,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, showCents = false): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  
  return formatter.format(amount);
}

/**
 * Round to nearest sensible increment for pricing display
 */
export function roundToNearestPricingIncrement(amount: number): number {
  if (amount < 1000) {
    // Round to nearest $50
    return Math.round(amount / 50) * 50;
  } else if (amount < 5000) {
    // Round to nearest $100
    return Math.round(amount / 100) * 100;
  } else {
    // Round to nearest $250
    return Math.round(amount / 250) * 250;
  }
}
