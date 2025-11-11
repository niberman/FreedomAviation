# Pricing System Quick Reference

## Overview
The Freedom Aviation pricing system uses an **Enhanced Hybrid Model** that combines the best features from three previous implementations into a single, comprehensive solution.

**Version:** 2.0 (Hybrid)  
**Last Updated:** November 10, 2025

## Pricing Structure

### Aircraft Tiers
| Tier | ID | Base Price | Examples |
|------|----|-----------:|----------|
| Light Aircraft | `light` | $850/mo | C172, C182, Archer, Cherokee |
| High Performance | `performance` | $1,650/mo | SR20, SR22, Mooney, Bonanza, DA40 |
| Turbine | `turbine` | $3,200/mo | TBM, Vision Jet, PC-12 |

### Hours Bands
| Range | Multiplier | Details/Month | Service Frequency |
|-------|----------:|---------------|-------------------|
| 0-20 hrs | 1.0x | 1 | Weekly readiness |
| 20-50 hrs | 1.45x | 2 | Pre-/post-flight cleaning |
| 50+ hrs | 1.9x | Unlimited | After every flight |

### Price Calculation
```
Monthly Price = Base Price × Hours Multiplier
```

**Examples:**
- Light Aircraft, 0-20 hrs: $850 × 1.0 = **$850/mo**
- High Performance, 20-50 hrs: $1,650 × 1.45 = **$2,393/mo**
- Turbine, 50+ hrs: $3,200 × 1.9 = **$6,080/mo**

## Core Features (All Tiers)
✅ Hangar at Centennial (KAPA)  
✅ Pre & post-flight prep  
✅ Cleaning & detailing  
✅ Fluid top-offs (Oil, O₂, TKS)  
✅ Avionics database updates  
✅ Owner portal access  
✅ Maintenance coordination  

## Developer Usage

### Import the Unified Pricing
```typescript
import { 
  PRICING_TIERS, 
  HOURS_BANDS, 
  CORE_FEATURES,
  calculateMonthlyPrice,
  recommendTierByAircraft,
  recommendHoursBand,
  type PricingTier,
  type HoursRange,
} from '@/lib/unified-pricing';
```

### Calculate a Price
```typescript
const price = calculateMonthlyPrice('performance', '20-50');
// Returns: 2393
```

### Get Recommendations
```typescript
// Recommend tier based on aircraft
const tier = recommendTierByAircraft('SR22T');
// Returns: 'performance'

// Recommend hours based on usage
const hours = recommendHoursBand(35);
// Returns: '20-50'
```

### Use the Calculator Component
```tsx
import { UnifiedPricingCalculator } from '@/components/unified-pricing-calculator';

// Basic usage
<UnifiedPricingCalculator />

// With props
<UnifiedPricingCalculator
  defaultTier="performance"
  defaultHours="20-50"
  compact={false}
  ctaText="Get Your Quote"
  onQuoteGenerated={() => console.log('Quote generated!')}
/>
```

## Updating Prices

### To Change Base Prices
Edit `/client/src/lib/unified-pricing.ts`:
```typescript
export const PRICING_TIERS: TierConfig[] = [
  {
    id: 'light',
    name: 'Light Aircraft',
    baseMonthly: 850, // ← Change this
    // ...
  },
  // ...
];
```

### To Change Hours Multipliers
```typescript
export const HOURS_BANDS: HoursBandConfig[] = [
  {
    range: '0-20',
    multiplier: 1.0, // ← Change this
    // ...
  },
  // ...
];
```

### To Add a New Tier
```typescript
export const PRICING_TIERS: TierConfig[] = [
  // ... existing tiers
  {
    id: 'multi-engine',
    name: 'Multi-Engine',
    title: 'Class IV — Multi-Engine',
    description: 'For multi-engine aircraft',
    examples: ['Baron', 'Seneca', '310'],
    baseMonthly: 4500,
    hoursBands: HOURS_BANDS,
  },
];
```

## Files Reference

### Core Files
- **Pricing Config:** `/client/src/lib/unified-pricing.ts`
- **Calculator Component:** `/client/src/components/unified-pricing-calculator.tsx`
- **Onboarding Types:** `/client/src/types/onboarding.ts`

### Implementation Files
- **Pricing Page:** `/client/src/pages/Pricing.tsx`
- **Membership Tiers:** `/client/src/components/membership-tiers.tsx`
- **Onboarding Membership Step:** `/client/src/components/onboarding/MembershipStep.tsx`
- **Onboarding Payment Step:** `/client/src/components/onboarding/PaymentStep.tsx`

### Deprecated Files (Removed)
- ~~`/client/src/components/simple-pricing-calculator.tsx`~~ → ✅ Removed (replaced by `UnifiedPricingCalculator`)
- ~~`/client/src/lib/pricing-packages.ts`~~ → ✅ Removed (replaced by `unified-pricing.ts`)

### New Features in v2.0
- ✅ **Addons System**: Optional enhancements (Concierge, Premium Detailing, Trip Planning, Multi-Aircraft)
- ✅ **Smart Recommendations**: AI-powered tier and hours band suggestions
- ✅ **Multi-Aircraft Discounts**: Automatic fleet pricing
- ✅ **Promotional Pricing**: Built-in discount support
- ✅ **Enhanced Type Safety**: Complete TypeScript coverage
- ✅ **Tier-Specific Features**: Premium features per aircraft class

## Common Tasks

### Task: Add a New Feature to All Tiers
Edit `CORE_FEATURES` in `/client/src/lib/unified-pricing.ts`:
```typescript
export const CORE_FEATURES: PricingFeature[] = [
  // ... existing features
  { 
    name: 'Trip planning assistance', 
    description: 'Flight planning support' 
  },
];
```

### Task: Adjust Pricing for a Season
Create a wrapper function:
```typescript
export function getSeasonalPrice(
  tier: PricingTier,
  hours: HoursRange,
  season: 'peak' | 'standard'
): number {
  const basePrice = calculateMonthlyPrice(tier, hours);
  return season === 'peak' ? basePrice * 1.15 : basePrice;
}
```

### Task: Create a Custom Quote
```typescript
import { createPricingSelection } from '@/lib/unified-pricing';

const quote = createPricingSelection('performance', '20-50');
// Returns: { tier: 'performance', hoursRange: '20-50', monthlyPrice: 2393 }
```

## Testing Checklist
When making pricing changes, test:
- [ ] Pricing page calculator shows correct prices
- [ ] Onboarding membership step calculates correctly
- [ ] Payment step displays accurate totals
- [ ] Quote generation includes correct pricing
- [ ] Admin views reflect changes
- [ ] All existing quotes remain valid

## Support
For questions or issues:
1. Check `/PRICING_STREAMLINE_SUMMARY.md` for detailed architecture
2. Review `/client/src/lib/unified-pricing.ts` for implementation
3. Check this guide for common usage patterns

---
**Last Updated:** November 2025  
**Version:** 1.0 (Unified Pricing System)

