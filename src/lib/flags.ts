// Feature Flags for Freedom Aviation
export const FEATURE_PARTNER_SKY_HARBOUR = true;
export const FEATURE_PARTNER_FA_HANGAR = true;

// Pricing Mode Flag (use NEXT_PUBLIC_PRICING_MODE env var)
// Set to 'configurator' to use database-driven pricing, or 'fixed' for static packages
export const PRICING_MODE = (process.env.NEXT_PUBLIC_PRICING_MODE || 'fixed') as 'fixed' | 'configurator';
export const isConfigurator = PRICING_MODE === 'configurator';
export const isFixedPricing = !isConfigurator; // Inverse of configurator mode
