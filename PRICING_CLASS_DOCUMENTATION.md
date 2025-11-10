# Pricing Configuration Classes by Aircraft Features

## Overview

The Freedom Aviation pricing system now differentiates pricing classes based on aircraft features, specifically TKS ice protection and oxygen systems. This ensures that aircraft requiring more complex fluid and systems management are appropriately priced.

## Pricing Class Structure

### Class I - Standard Aircraft
- **Base Monthly Rate**: $599
- **Aircraft Requirements**: 
  - `has_tks = false` AND `has_oxygen = false`
  - Only requires oil management
- **Services Included**:
  - Oil top-offs
  - Standard scheduling
  - Monthly safety briefing
  - Basic maintenance oversight

### Class II - Advanced Systems
- **Base Monthly Rate**: $899
- **Aircraft Requirements**: 
  - `has_tks = true` OR `has_oxygen = true`
  - Requires TKS fluid and/or oxygen management
- **Services Included**:
  - Oil top-offs
  - TKS fluid management (if equipped)
  - Oxygen system management (if equipped)
  - Priority scheduling
  - Advanced maintenance tracking
  - Enhanced consumables monitoring

## Aircraft Features

### TKS Ice Protection System (`has_tks`)
- Boolean flag stored in `aircraft.has_tks` column
- Indicates aircraft has TKS weeping wing ice protection
- Requires regular TKS fluid top-offs and system maintenance
- Common on: SR22T, TBM, PC-12, and other high-performance singles/twins

### Oxygen System (`has_oxygen`)
- Boolean flag stored in `aircraft.has_oxygen` column
- Indicates aircraft has supplemental oxygen system
- Requires oxygen bottle refills and system inspections
- Common on: High-altitude capable aircraft (SR22T, turboprops, jets)

## Pricing Determination Logic

The system automatically assigns pricing class based on aircraft features:

```typescript
function determineClassByFeatures(has_tks: boolean, has_oxygen: boolean): 'class-i' | 'class-ii' {
  if (has_tks || has_oxygen) {
    return 'class-ii';  // $899/month
  }
  return 'class-i';  // $599/month
}
```

## Database Schema Changes

### Aircraft Table Columns
```sql
-- Added to public.aircraft table
has_tks BOOLEAN DEFAULT false;
has_oxygen BOOLEAN DEFAULT false;
```

### Pricing Classes Table
```sql
-- Simplified structure (removed surcharge columns)
CREATE TABLE public.pricing_classes (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  base_monthly DECIMAL(10, 2) NOT NULL,
  description TEXT,
  features JSONB,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migration Scripts

### 1. Add Aircraft Features
Run: `scripts/add-aircraft-features.sql`
- Adds `has_tks` and `has_oxygen` columns to aircraft table
- Sets defaults to `false`
- Creates index for feature-based queries

### 2. Update Pricing Classes
Run: `scripts/update-pricing-classes-by-features.sql`
- Removes old multi-tier class structure
- Creates new 2-class system (Class I and Class II)
- Updates pricing and descriptions

## Usage in Application

### Creating/Editing Aircraft
When staff adds or edits an aircraft in the system:
1. Mark "TKS Ice Protection" checkbox if aircraft has TKS
2. Mark "Oxygen System" checkbox if aircraft has oxygen
3. System automatically determines correct pricing class

### Pricing Configuration
The pricing configurator uses aircraft features to:
1. Automatically select the appropriate pricing class
2. Display correct monthly rate based on features
3. Calculate total costs including feature-specific maintenance

## Examples

### Example 1: Cessna 172
- Make: Cessna
- Model: 172
- has_tks: `false`
- has_oxygen: `false`
- **Pricing Class**: Class I ($599/month)

### Example 2: Cirrus SR22T
- Make: Cirrus
- Model: SR22T
- has_tks: `true`
- has_oxygen: `true`
- **Pricing Class**: Class II ($899/month)

### Example 3: Piper Archer
- Make: Piper
- Model: Archer
- has_tks: `false`
- has_oxygen: `false`
- **Pricing Class**: Class I ($599/month)

### Example 4: TBM 940
- Make: Daher
- Model: TBM 940
- has_tks: `true`
- has_oxygen: `true`
- **Pricing Class**: Class II ($899/month)

## Cost Justification

### Class I ($599/month)
- Oil changes and top-offs: ~$100/month
- Basic pre-flight prep: ~$150/month
- Scheduling and admin: ~$100/month
- Insurance and overhead: ~$249/month

### Class II ($899/month)
- All Class I services: ~$599/month
- TKS fluid and management: ~$150/month
- Oxygen refills and testing: ~$100/month
- Additional systems monitoring: ~$50/month

## Benefits

1. **Transparent Pricing**: Owners understand pricing is based on aircraft complexity
2. **Fair Cost Distribution**: Owners of simpler aircraft pay less
3. **Accurate Costing**: Service costs reflect actual consumables and labor
4. **Scalable**: Easy to add new features in the future (e.g., air conditioning, de-ice)
5. **Simple Administration**: Clear rules, no subjective pricing decisions


