# Schema Synchronization Issues Report

## 🚨 Critical Issues Found

This document compares the actual Supabase database schema (from CSV export) with the codebase type definitions and identifies mismatches that could cause runtime errors.

---

## 1. Aircraft Table - Duplicate Column Names ⚠️

**Issue**: The database has BOTH `hobbs_time`/`tach_time` AND `hobbs_hours`/`tach_hours` columns.

**Database Columns (from CSV)**:
- `hobbs_time` (numeric) - Line 2332
- `tach_time` (numeric) - Line 2333
- `hobbs_hours` (numeric, 10,2) - Line 2338
- `tach_hours` (numeric, 10,2) - Line 2339

**TypeScript Types**: Only references `hobbs_hours` and `tach_hours`

**Impact**: 
- ✅ Code currently works (uses correct column names)
- ⚠️ Database has redundant columns that should be cleaned up
- 🔧 Old data may exist in `hobbs_time`/`tach_time` columns

**Recommendation**:
```sql
-- Migration needed to consolidate columns
-- 1. Check if hobbs_time/tach_time have any data
SELECT COUNT(*) FROM aircraft WHERE hobbs_time IS NOT NULL OR tach_time IS NOT NULL;

-- 2. If yes, migrate data:
UPDATE aircraft 
SET hobbs_hours = COALESCE(hobbs_hours, hobbs_time),
    tach_hours = COALESCE(tach_hours, tach_time)
WHERE hobbs_time IS NOT NULL OR tach_time IS NOT NULL;

-- 3. Drop old columns:
ALTER TABLE aircraft DROP COLUMN IF EXISTS hobbs_time;
ALTER TABLE aircraft DROP COLUMN IF EXISTS tach_time;
```

---

## 2. Aircraft Table - Missing Columns in TypeScript ⚠️

**Missing from TypeScript types but exist in database**:
- `status` (text, default: 'active') - Line 2328
- `usable_fuel_gal` (numeric, 6,1) - Line 2333
- `tabs_fuel_gal` (numeric, 6,1) - Line 2334

**Impact**: Code cannot access these columns even though they exist

**Recommendation**: Update TypeScript types in `shared/database-types.ts` and `shared/supabase-types.ts`:

```typescript
export interface Aircraft {
  id: string;
  tail_number: string;
  make: string;
  model: string;
  year?: number;
  class?: string;
  hobbs_hours?: number;
  tach_hours?: number;
  image_url?: string;
  owner_id?: string;
  base_location?: string;
  status?: string;  // ADD THIS
  usable_fuel_gal?: number;  // ADD THIS
  tabs_fuel_gal?: number;  // ADD THIS
  has_tks?: boolean;
  has_oxygen?: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 3. User Roles - Dual Enum System ⚠️

**Issue**: Database has TWO enum types for user roles:
1. `user_role` enum - Used by `user_profiles.role` column
2. `app_role` enum - Used by `user_roles.role` column

**Database Tables**:
- `user_profiles` table with `role` column (user_role enum) - Lines 2581-2589
- `user_roles` table with `role` column (app_role enum) - Lines 2590-2592

**Migration Status**: 
- Migration file `migrations/fix_user_creation_trigger.sql` attempts to drop `user_roles` table
- But CSV shows the table still exists

**Impact**: 
- ⚠️ Confusion about which table/enum to use for roles
- 🔧 Migration may not have been applied
- ⚠️ Potential for role data inconsistency

**Recommendation**:
```sql
-- Verify user_roles table status
SELECT COUNT(*) FROM public.user_roles;

-- If it has data, migrate to user_profiles.role first
INSERT INTO user_profiles (id, email, role, created_at, updated_at)
SELECT 
  ur.user_id,
  au.email,
  ur.role::text::user_role,
  ur.assigned_at,
  NOW()
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Then drop user_roles table and app_role enum
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS app_role CASCADE;
```

---

## 4. Memberships Table - Column Name Mismatch ⚠️

**Database** (Lines 2489-2498):
- Has column: `tier` (text)
- Has column: `tier_id` (uuid, FK to membership_tiers)
- Has column: `is_active` (boolean)

**TypeScript**:
```typescript
// shared/database-types.ts uses 'tier' as MembershipClass enum
tier: MembershipClass;
is_active: boolean;  // ✅ Matches

// But CSV shows tier is TEXT, not enum
```

**Issue**: The `tier` column in database is `text` type, not `membership_class` enum

**Recommendation**: Clarify if tier should be:
- A) The membership_class enum ('I', 'II', 'III')
- B) A reference to membership_tiers table via tier_id

---

## 5. Invoices Table - Missing TypeScript Properties ⚠️

**Database columns not in TypeScript** (Lines 2433-2451):
- `total_cents` (integer)
- `period_start` (date)
- `period_end` (date)
- `hosted_invoice_url` (text)

**TypeScript has** `amount` (number) but database also has `total_cents`

**Recommendation**: Update Invoice interface:

```typescript
export interface Invoice {
  id: string;
  owner_id: string;
  aircraft_id?: string;
  invoice_number: string;
  amount: number;
  total_cents?: number;  // ADD THIS (may be redundant with amount)
  period_start?: string;  // ADD THIS
  period_end?: string;  // ADD THIS
  hosted_invoice_url?: string;  // ADD THIS
  status: string;
  category: 'membership' | 'instruction' | 'service';
  created_by_cfi_id?: string;
  due_date?: string;
  paid_date?: string;
  line_items?: Record<string, any>;
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 6. Service Requests - Column Mismatch 🔧

**Database has** (Lines 2529-2553):
- `requested_date` (date)
- `requested_time` (time)

**TypeScript only has**:
- `requested_departure` (string - timestamptz)

**Impact**: Code may not be able to set date/time separately

**Recommendation**: Add missing columns to TypeScript types:

```typescript
export interface ServiceRequest {
  // ... existing fields ...
  requested_departure?: string;
  requested_date?: string;  // ADD THIS
  requested_time?: string;  // ADD THIS
  // ... rest of fields ...
}
```

---

## 7. Missing Tables in TypeScript 🔍

The database has these tables that aren't defined in TypeScript types:

1. **`client_billing_profiles`** (Lines 2355-2365)
   - Stores Stripe payment methods per client
   - Columns: user_id, stripe_customer_id, stripe_default_pm_id, display_brand, etc.

2. **`email_notifications`** (Lines 2374-2382)
   - Email queue/log system
   - Columns: type, recipient_role, data, status, sent_at, error_message

3. **`flight_logs`** (Lines 2383-2404)
   - Detailed flight logging
   - Columns: aircraft_id, pilot_id, date, departure/arrival times, flight_time_hours, etc.

4. **`instruction_requests`** (Lines 2415-2426)
   - CFI instruction scheduling
   - Columns: student_id, aircraft_id, cfi_id, requested_date, instruction_type, etc.

5. **`invoice_lines`** (Lines 2427-2432)
   - Invoice line items (separate from invoices.line_items jsonb)

6. **`support_tickets`** (Lines 2574-2580)
   - Support/help desk system

7. **`settings`** (Lines 2564-2565)
   - Global settings (currently only has default_fuel_rate)

**Recommendation**: Add interfaces for these tables to `shared/database-types.ts`

---

## 8. Views in Database ℹ️

The database has several views that should be documented:

1. **`v_memberships`** (Lines 2593-2603)
   - Joins memberships with membership_tiers
   - Includes tier_name and base_price

2. **`v_owner_aircraft`** (Lines 2604-2613)
   - Filtered view of aircraft table

3. **`v_service_requests`** (Lines 2614-2637)
   - Enhanced service requests with aircraft and requester info

These views should be usable from TypeScript with proper typing.

---

## Summary of Action Items

### Immediate (Critical)
1. ✅ Update Aircraft interface to include `status`, `usable_fuel_gal`, `tabs_fuel_gal`
2. ✅ Add missing Invoice columns
3. ✅ Add missing ServiceRequest columns
4. ⚠️ Resolve user_roles vs user_profiles.role confusion

### Important (Should Do Soon)
5. 🔧 Clean up duplicate aircraft columns (hobbs_time vs hobbs_hours)
6. 📝 Add TypeScript interfaces for missing tables:
   - client_billing_profiles
   - email_notifications
   - flight_logs
   - instruction_requests
   - invoice_lines
   - support_tickets
   - settings

### Nice to Have
7. 📚 Document database views
8. 🧹 Clean up any unused tables/columns
9. 🔄 Ensure all migrations have been applied

---

## Testing Recommendations

After making these updates:

1. **Type Check**: Run `npm run type-check` (if available)
2. **Database Query Test**: Test all major queries to ensure they work with updated types
3. **RLS Policy Test**: Verify Row Level Security policies still work correctly
4. **Migration Test**: Test on a staging environment before production

---

## Files to Update

1. `/shared/database-types.ts` - Add missing interfaces and properties
2. `/shared/supabase-types.ts` - Update to match database-types.ts
3. `/client/src/lib/types/database.ts` - Sync with shared types
4. Run migration SQL scripts to clean up duplicate columns

---

Generated: {{ date }}
Based on: Supabase Snippet Schema CSV Export

