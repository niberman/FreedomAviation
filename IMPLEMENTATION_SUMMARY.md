# Pricing Configuration by Aircraft Features - Implementation Summary

## Overview
Implemented a feature-based pricing classification system where pricing classes are determined by aircraft systems (TKS ice protection and oxygen), rather than arbitrary service tiers.

## Pricing Structure

### Class I - Standard Aircraft ($599/month)
- **Requirements**: Aircraft with only oil management
- **Criteria**: `has_tks = false` AND `has_oxygen = false`
- **Examples**: Cessna 172, Piper Archer, basic training aircraft

### Class II - Advanced Systems ($899/month)
- **Requirements**: Aircraft with TKS and/or oxygen systems
- **Criteria**: `has_tks = true` OR `has_oxygen = true`
- **Examples**: Cirrus SR22T, TBM 940, PC-12, high-altitude aircraft

## Changes Made

### 1. Database Schema Updates

#### Aircraft Table (`public.aircraft`)
```sql
-- Added columns:
has_tks BOOLEAN DEFAULT false
has_oxygen BOOLEAN DEFAULT false
```

#### Pricing Classes Table (`public.pricing_classes`)
- Removed: Old 4-tier class structure (Class I, II, III, III Plus)
- Added: New 2-tier feature-based structure
- Simplified: No surcharge columns needed

### 2. TypeScript Type Updates

**Files Modified:**
- `client/src/lib/types/database.ts` - Added `has_tks` and `has_oxygen` to Aircraft types
- `shared/supabase-types.ts` - Updated Aircraft interface
- `client/src/lib/pricing/types.ts` - Updated ClassCfg and RowInput types
- `client/src/lib/hooks/useAircraft.ts` - Added feature fields to validation schema

### 3. Backend Logic Updates

**`client/src/lib/pricing/calc.ts`**
- Updated `calcRow()` function with documentation
- Added `determineClassByFeatures()` helper function:
  ```typescript
  function determineClassByFeatures(has_tks: boolean, has_oxygen: boolean): 'class-i' | 'class-ii' {
    if (has_tks || has_oxygen) {
      return 'class-ii';
    }
    return 'class-i';
  }
  ```

### 4. Frontend Updates

**`client/src/components/aircraft-table.tsx`**
- Added TKS and oxygen checkboxes to aircraft creation form
- Updated form state to include `hasTks` and `hasOxygen`
- Added validation and submission logic for new fields
- Added informational text explaining class determination

**Features:**
- ✅ Checkbox for "TKS Ice Protection"
- ✅ Checkbox for "Oxygen System"
- ✅ Helper text: "Systems determine pricing class: Class I (oil only) or Class II (TKS/oxygen)"

### 5. Migration Scripts Created

**`scripts/add-aircraft-features.sql`**
- Adds `has_tks` and `has_oxygen` columns to aircraft table
- Creates index for feature-based queries
- Includes safety checks (IF NOT EXISTS)

**`scripts/update-pricing-classes-by-features.sql`**
- Removes old pricing class structure
- Creates new Class I and Class II configurations
- Updates descriptions and pricing

### 6. Documentation

**`PRICING_CLASS_DOCUMENTATION.md`**
- Complete guide to the new pricing system
- Examples of aircraft in each class
- Cost justification breakdown
- Migration instructions
- Usage guidelines

## Benefits

1. **Transparent**: Owners understand pricing is based on actual aircraft complexity
2. **Fair**: Simpler aircraft cost less to service, and pricing reflects that
3. **Accurate**: Costs directly tied to consumables (oil, TKS fluid, oxygen)
4. **Scalable**: Easy to add more features in the future
5. **Simple**: Clear rules, no subjective decisions

## Testing Checklist

- [ ] Run database migration: `scripts/add-aircraft-features.sql`
- [ ] Run pricing update: `scripts/update-pricing-classes-by-features.sql`
- [ ] Test aircraft creation with TKS checkbox
- [ ] Test aircraft creation with oxygen checkbox
- [ ] Test aircraft creation with both checkboxes
- [ ] Test aircraft creation with neither checkbox
- [ ] Verify pricing calculator shows correct class based on features
- [ ] Test aircraft editing to add/remove features
- [ ] Verify existing aircraft default to Class I (false, false)

## Migration Steps

### For Existing Installations:

1. **Backup Database**
   ```bash
   # Backup your database before running migrations
   ```

2. **Run Aircraft Features Migration**
   ```sql
   -- Run: scripts/add-aircraft-features.sql
   -- Adds has_tks and has_oxygen columns
   -- Defaults all existing aircraft to false (Class I)
   ```

3. **Update Pricing Classes**
   ```sql
   -- Run: scripts/update-pricing-classes-by-features.sql
   -- Updates pricing class structure
   ```

4. **Update Aircraft Features**
   ```sql
   -- Manually update aircraft with TKS/oxygen:
   UPDATE public.aircraft 
   SET has_tks = true, has_oxygen = true 
   WHERE model IN ('SR22T', 'TBM 940', 'PC-12');
   ```

5. **Verify Changes**
   ```sql
   -- Check aircraft features:
   SELECT tail_number, make, model, has_tks, has_oxygen 
   FROM public.aircraft;
   
   -- Check pricing classes:
   SELECT name, slug, base_monthly FROM public.pricing_classes;
   ```

## Files Changed

### Database
- ✅ `supabase-schema.sql` - Updated with aircraft features
- ✅ `pricing-schema.sql` - Simplified pricing classes
- ✅ `scripts/add-aircraft-features.sql` - NEW
- ✅ `scripts/update-pricing-classes-by-features.sql` - NEW

### Backend/Types
- ✅ `client/src/lib/types/database.ts`
- ✅ `shared/supabase-types.ts`
- ✅ `client/src/lib/pricing/types.ts`
- ✅ `client/src/lib/pricing/calc.ts`
- ✅ `client/src/lib/hooks/useAircraft.ts`
- ✅ `client/src/features/pricing/hooks.ts`

### Frontend
- ✅ `client/src/components/aircraft-table.tsx`

### Documentation
- ✅ `PRICING_CLASS_DOCUMENTATION.md` - NEW
- ✅ `IMPLEMENTATION_SUMMARY.md` - NEW (this file)

## Next Steps

1. Deploy database migrations to production
2. Update existing aircraft records with correct feature flags
3. Train staff on new aircraft creation process
4. Update any customer-facing documentation
5. Monitor pricing calculations for accuracy

## Support

For questions or issues with this implementation:
1. Review `PRICING_CLASS_DOCUMENTATION.md`
2. Check migration scripts for proper execution
3. Verify aircraft features are correctly set in database
4. Test pricing calculator with sample aircraft


