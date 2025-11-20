# Schema Alignment Fixes
**Date**: November 20, 2025  
**Related**: SCHEMA_ALIGNMENT_AUDIT_REPORT.md

This document provides complete, ready-to-apply fixes for all schema mismatches identified in the audit.

---

## Fix 1: Remove `support_tickets` References

### Option A: Replace with `membership_quotes` table (RECOMMENDED)

#### Step 1: Create `membership_quotes` table (if not exists)

```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.membership_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  tier_name TEXT,
  base_monthly NUMERIC,
  hangar_id TEXT,
  hangar_cost NUMERIC,
  total_monthly NUMERIC,
  aircraft_tail TEXT,
  aircraft_make TEXT,
  aircraft_model TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.membership_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
  ON public.membership_quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotes"
  ON public.membership_quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all quotes"
  ON public.membership_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin', 'founder', 'ops')
    )
  );
```

#### Step 2: Update TypeScript types

Add to `client/src/lib/types/database.ts`:

```typescript
membership_quotes: {
  Row: {
    id: string
    user_id: string
    package_id: string
    tier_name: string | null
    base_monthly: number | null
    hangar_id: string | null
    hangar_cost: number | null
    total_monthly: number | null
    aircraft_tail: string | null
    aircraft_make: string | null
    aircraft_model: string | null
    status: string
    notes: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    package_id: string
    tier_name?: string | null
    base_monthly?: number | null
    hangar_id?: string | null
    hangar_cost?: number | null
    total_monthly?: number | null
    aircraft_tail?: string | null
    aircraft_make?: string | null
    aircraft_model?: string | null
    status?: string
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    package_id?: string
    tier_name?: string | null
    base_monthly?: number | null
    hangar_id?: string | null
    hangar_cost?: number | null
    total_monthly?: number | null
    aircraft_tail?: string | null
    aircraft_make?: string | null
    aircraft_model?: string | null
    status?: string
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
}
```

And add helper types:

```typescript
export type MembershipQuote = Database['public']['Tables']['membership_quotes']['Row']
export type MembershipQuoteInsert = Database['public']['Tables']['membership_quotes']['Insert']
export type MembershipQuoteUpdate = Database['public']['Tables']['membership_quotes']['Update']
```

#### Step 3: Fix `client/src/pages/login.tsx`

Replace lines 199-209 with:

```typescript
// Save the quote
await supabase.from("membership_quotes").insert([{
  user_id: userData.user.id,
  package_id: quoteData.aircraft_class,
  tier_name: quoteData.aircraft_class,
  total_monthly: quoteData.monthly_price,
  notes: JSON.stringify({
    monthly_hours: quoteData.monthly_hours,
    source: "signup_flow",
  }),
  status: "pending",
}]);
```

#### Step 4: Fix `client/src/components/unified-pricing-calculator.tsx`

Replace lines 105-120 with:

```typescript
// User is logged in - save the quote
await supabase.from('membership_quotes').insert([{
  user_id: userData.user.id,
  package_id: selectedTier,
  tier_name: selectedTierData.name,
  base_monthly: basePrice,
  hangar_id: selectedLocation?.id || null,
  hangar_cost: hangarCost,
  total_monthly: totalPrice,
  notes: JSON.stringify({
    hours_range: selectedHours,
    addons: selectedAddons,
    source: 'pricing_calculator',
  }),
  status: 'pending',
}]);
```

---

## Fix 2: Fix or Remove `consumable_events` Reference

### Option A: Create the table (if consumables tracking is needed)

```sql
CREATE TABLE IF NOT EXISTS public.consumable_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,  -- e.g., 'OIL', 'FUEL', 'TKS', 'OXYGEN'
  quantity NUMERIC,
  unit TEXT,  -- e.g., 'qt', 'gal', 'lbs'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS
ALTER TABLE public.consumable_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their aircraft consumables"
  ON public.consumable_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.aircraft
      WHERE aircraft.id = consumable_events.aircraft_id
      AND aircraft.owner_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all consumables"
  ON public.consumable_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin', 'founder', 'ops')
    )
  );

CREATE POLICY "Staff can create consumable events"
  ON public.consumable_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('staff', 'admin', 'founder', 'ops')
    )
  );
```

### Option B: Replace with service_requests (RECOMMENDED)

Update `client/src/components/aircraft-table.tsx` line 140-149:

```typescript
if (serviceType === "oil_topoff") {
  // Create a service request instead of consumable event
  const { error } = await supabase
    .from("service_requests")
    .insert([
      {
        aircraft_id: aircraft.id,
        user_id: aircraft.owner_id, // Need to get this
        service_type: "Oil Top-Off",
        description: `Oil top-off: ${notes || "2 quarts requested from staff dashboard"}`,
        priority: "low",
        status: "pending",
        is_extra_charge: true,
        credits_used: 0,
      },
    ]);

  if (error) throw error;
  
  toast({
    title: "Success",
    description: "Oil top-off request created",
  });
}
```

---

## Fix 3: Fix or Verify `instruction_requests` Reference

### Option A: Verify table exists and keep as-is

Run this query to check:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'instruction_requests'
);
```

If table exists, ensure RLS policies are correct.

### Option B: Replace with service_requests (RECOMMENDED)

Update `client/src/components/request-instruction-sheet.tsx` lines 76-87:

```typescript
const { error } = await supabase
  .from("service_requests")
  .insert({
    aircraft_id: aircraft.id,
    user_id: user.id,
    service_type: "Flight Instruction",
    description: `${instructionType} - ${duration} hours`,
    priority: "medium",
    status: "pending",
    requested_date: format(date, "yyyy-MM-dd"),
    requested_time: time,
    notes: notes || null,
    is_extra_charge: true,
    credits_used: 0,
  });
```

---

## Fix 4: Update `VOwnerAircraft` Interface

Edit `shared/database-types.ts` line 762-763:

**BEFORE**:
```typescript
export interface VOwnerAircraft {
  id: string;
  tail_number: string;
  model: string;
  owner_id?: string;
  base_location?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  hobbs_time?: number;  // ❌ OLD
  tach_time?: number;   // ❌ OLD
}
```

**AFTER**:
```typescript
export interface VOwnerAircraft {
  id: string;
  tail_number: string;
  model: string;
  owner_id?: string;
  base_location?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  hobbs_hours?: number;  // ✅ CORRECT
  tach_hours?: number;   // ✅ CORRECT
}
```

---

## Fix 5: Verify `email_notifications` Table

Run this SQL to check if table exists:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'email_notifications'
);
```

If it doesn't exist, create it:

```sql
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,  -- 'service_request', 'instruction_request', 'maintenance_due', etc.
  recipient_role TEXT NOT NULL,  -- 'ops', 'cfi', 'owner', etc.
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',  -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON public.email_notifications(created_at);

-- No RLS needed - server-side only table
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by server)
CREATE POLICY "Service role has full access"
  ON public.email_notifications
  USING (true)
  WITH CHECK (true);
```

---

## Fix 6: Type System Consolidation

### Recommended Approach: Keep One Source of Truth

**Option A: Use `client/src/lib/types/database.ts` as primary (RECOMMENDED)**

1. Keep `client/src/lib/types/database.ts` as-is ✅
2. Update `shared/database-types.ts` to export from client types:

```typescript
// shared/database-types.ts
// Re-export types from the authoritative source
export * from '../client/src/lib/types/database';

// Keep only additional types not in database.ts
// (Keep legacy types for backward compatibility if needed)
```

3. Update `shared/supabase-types.ts` to re-export as well:

```typescript
// shared/supabase-types.ts
// Simplified - re-export from authoritative source
export * from '../client/src/lib/types/database';
```

**Option B: Consolidate all into `shared/database-types.ts`**

1. Copy all types from `client/src/lib/types/database.ts` to `shared/database-types.ts`
2. Update all imports across codebase
3. Delete `client/src/lib/types/database.ts` and `shared/supabase-types.ts`

---

## Fix 7: Remove `membership_tiers` Reference (if not used)

If NOT using a separate membership_tiers table (using enum-based tiers instead):

1. Remove interface from `shared/database-types.ts` line 71-82
2. Update documentation in `docs/features/pricing.md` line 307

---

## Testing Checklist

After applying fixes, test:

- [ ] `npm run build` - TypeScript compilation succeeds
- [ ] `npm test` - All tests pass
- [ ] Login flow with pricing quote
- [ ] Pricing calculator quote submission
- [ ] Aircraft oil top-off request
- [ ] Flight instruction request
- [ ] Email notifications still work
- [ ] No console errors in browser
- [ ] All Supabase queries succeed

---

## Deployment Order

1. **Database changes first** (create tables if needed)
2. **Deploy server code** (with updated queries)
3. **Deploy client code** (with updated queries)
4. **Run migrations** (cleanup old columns)
5. **Verify in production**

---

**IMPORTANT**: Test ALL changes in staging environment before deploying to production!

---

**End of Fixes Document**  
**Generated**: November 20, 2025

