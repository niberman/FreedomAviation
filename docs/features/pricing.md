# Pricing System

Documentation for Freedom Aviation's pricing structure and calculator.

## Overview

Freedom Aviation offers three membership tiers (Class I, II, III) with optional hangar upgrades. Pricing varies based on:
- Aircraft type and class
- Monthly flight hour usage
- Hangar location
- Additional services

---

## Membership Tiers

### Class I - Entry Level

**Target Aircraft**: Single-engine piston aircraft

**Base Monthly Rate**: Starting at $1,800/month

**Includes**:
- Basic aircraft management
- Standard maintenance coordination
- Flight planning support
- Monthly service credits

**Flight Hours**:
- 0-10 hours: Base rate
- 10-20 hours: Moderate usage pricing
- 20-50 hours: High usage pricing

### Class II - Intermediate

**Target Aircraft**: High-performance singles, light twins

**Base Monthly Rate**: Starting at $2,200/month

**Includes**:
- Enhanced aircraft management
- Priority maintenance scheduling
- Advanced flight planning
- Increased monthly service credits
- TKS system support
- Oxygen system management

**Flight Hours**:
- 0-10 hours: Base rate
- 10-20 hours: Moderate usage pricing
- 20-50 hours: High usage pricing

### Class III - Premium

**Target Aircraft**: Turboprops, light jets, complex twins

**Base Monthly Rate**: Starting at $3,500/month

**Includes**:
- Premium aircraft management
- Concierge services
- 24/7 priority support
- Maximum monthly service credits
- All Class II benefits
- Additional crew coordination

**Flight Hours**:
- 0-10 hours: Base rate
- 10-20 hours: Moderate usage pricing
- 20-50 hours: High usage pricing

---

## Hangar Options

### Freedom Aviation Hangar

**Location**: 7565 S Peoria St, Englewood, CO 80112 (KAPA)

**Cost**: $0/month (included in base price)

**Features**:
- Climate-controlled hangar space
- 24/7 secure access
- Ground power unit (GPU) available
- Dedicated aircraft parking
- On-site fuel services
- Professional cleaning services
- Maintenance coordination

**Why $0?**: Hangar cost is already included in the base aircraft management price. No additional fees for standard hangar services.

### Sky Harbour (Preferred Partner)

**Location**: Premium facility at Centennial Airport

**Cost**: +$2,000/month

**Features**:
- Purpose-built aviation infrastructure
- Premium facility amenities
- VIP lounge and pilot facilities
- Advanced security systems
- Climate-controlled environment
- Concierge services
- Same management services as Freedom Aviation Hangar

**Upgrade Benefits**:
- Premium location and facilities
- Enhanced amenities
- Preferred partner infrastructure
- All standard services included

**Note**: Both hangar locations provide equal-quality aircraft management services. The Sky Harbour upgrade is for facility amenities only.

---

## Pricing Calculator

The pricing calculator dynamically calculates monthly costs based on:

1. **Aircraft Type** (determines tier)
2. **Monthly Flight Hours** (adjusts pricing)
3. **Hangar Selection** (Freedom Aviation or Sky Harbour)

### How It Works

```
Base Price (from tier) + Hangar Cost = Total Monthly Cost
```

**Example 1**: Performance aircraft, 10-20 hrs/month, Freedom Aviation Hangar
- Base: $2,200/month
- Hangar: $0/month
- **Total: $2,200/month**

**Example 2**: Same aircraft, Sky Harbour
- Base: $2,200/month
- Hangar: +$2,000/month
- **Total: $4,200/month**

### Calculator Features

- **Real-time updates**: Prices update as selections change
- **Hover details**: Hover over options for more information
- **Responsive design**: Works on all devices
- **Direct booking**: CTA leads to contact/onboarding flow

---

## Database Structure

### Tables

#### pricing_locations

Stores hangar location information:

```sql
CREATE TABLE pricing_locations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  hangar_cost_monthly INTEGER NOT NULL,  -- in cents
  description TEXT,
  address TEXT,
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Locations**:
```json
[
  {
    "name": "Freedom Aviation Hangar",
    "slug": "freedom-aviation-hangar",
    "hangar_cost_monthly": 0,
    "address": "7565 S Peoria St, Englewood, CO 80112"
  },
  {
    "name": "Sky Harbour",
    "slug": "sky-harbour",
    "hangar_cost_monthly": 200000,  // $2,000 in cents
    "address": "Centennial Airport, CO"
  }
]
```

#### membership_tiers

Stores tier definitions:

```sql
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  monthly_base_rate INTEGER NOT NULL,  -- in cents
  features JSONB,
  sort_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tiers**:
- Class I: Entry level
- Class II: Intermediate
- Class III: Premium

---

## Updating Pricing

### Update Hangar Costs

**Method 1: SQL Migration** (Recommended)

```sql
-- See migrations/update_hangar_pricing.sql
UPDATE pricing_locations
SET hangar_cost_monthly = 200000  -- $2,000 in cents
WHERE slug = 'sky-harbour';
```

**Method 2: Supabase Dashboard**

1. Go to Supabase → Database → Table Editor
2. Select `pricing_locations` table
3. Find Sky Harbour row
4. Update `hangar_cost_monthly` field
5. Save changes

### Update Membership Tiers

```sql
UPDATE membership_tiers
SET monthly_base_rate = 220000  -- $2,200 in cents
WHERE slug = 'class-ii';
```

### Price Display

Prices are stored in **cents** in the database but displayed in **dollars**:

```typescript
// Convert cents to dollars for display
const priceInDollars = priceInCents / 100;

// Format as currency
const formatted = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(priceInDollars);

// Output: "$2,200"
```

---

## Pricing Calculator Implementation

### Frontend Component

Located: `client/src/pages/Pricing.tsx`

**Key Features**:
- Dynamic tier selection
- Hangar location toggle
- Real-time price calculation
- Responsive design
- SEO optimized

**State Management**:
```typescript
const [selectedTier, setSelectedTier] = useState<string | null>(null);
const [selectedHangar, setSelectedHangar] = useState<string>('freedom-aviation-hangar');
const [monthlyFlightHours, setMonthlyFlightHours] = useState<number>(10);
```

**Price Calculation**:
```typescript
const calculatePrice = () => {
  const tierPrice = getTierPrice(selectedTier, monthlyFlightHours);
  const hangarPrice = getHangarPrice(selectedHangar);
  return tierPrice + hangarPrice;
};
```

### Data Fetching

```typescript
// Fetch pricing data from Supabase
const { data: locations } = await supabase
  .from('pricing_locations')
  .select('*')
  .eq('active', true);

const { data: tiers } = await supabase
  .from('membership_tiers')
  .select('*')
  .eq('is_active', true)
  .order('sort_order');
```

---

## Pricing Display Strategy

### Marketing Pages

- Show "Starting at $X/month"
- Link to pricing calculator for exact quotes
- Emphasize value and included services

### Pricing Calculator

- Show exact monthly costs
- Break down components (base + hangar)
- Clear CTA to contact/sign up

### Member Dashboard

- Show current plan details
- Display upcoming charges
- Link to modify plan

---

## Special Pricing

### Discounts

Discounts can be applied through:
1. **Promo codes** (future feature)
2. **Custom quotes** (via membership_quotes table)
3. **Long-term commitments** (annual vs monthly)

### Custom Quotes

For non-standard aircraft or special requirements:

```sql
-- Create custom quote
INSERT INTO membership_quotes (
  user_id,
  tier_name,
  base_monthly,
  hangar_id,
  hangar_cost,
  total_monthly,
  notes
) VALUES (
  'user-uuid',
  'Custom Class II',
  220000,  -- $2,200
  'hangar-uuid',
  200000,  -- $2,000
  420000,  -- $4,200 total
  'Multi-engine piston, high usage'
);
```

---

## Best Practices

### Pricing Updates

1. **Test in staging first**
2. **Communicate changes** to existing members
3. **Grandfather existing plans** (optional)
4. **Update marketing materials** after database changes

### Display Guidelines

✅ **Do**:
- Show total monthly cost prominently
- Break down pricing components
- Use clear currency formatting
- Provide comparison tools

❌ **Don't**:
- Hide additional fees
- Use confusing terminology
- Show inconsistent pricing across pages
- Make it difficult to understand costs

---

## Related Documentation

- [Membership System](membership.md) - Membership management
- [Database Schema](../architecture/database-schema.md) - Table structures
- [Pricing Page Component](../../client/src/pages/Pricing.tsx) - Implementation

---

**Last Updated**: November 2025  
**Maintained By**: Product Team

