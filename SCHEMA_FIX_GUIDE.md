# Schema Validation - Quick Fix Guide

**Priority:** 🔴 High  
**Estimated Time:** 30 minutes  
**Impact:** Prevents potential runtime errors

---

## Issue #1: Fix `supabase-types.ts` Membership Interface

### Problem
The `Membership` interface in `shared/supabase-types.ts` has incorrect field names that don't match the database.

### Current Code (WRONG)
```typescript
// shared/supabase-types.ts:33-44
export interface Membership {
  id: string;
  user_id: string;           // ❌ WRONG - field doesn't exist in database
  aircraft_id?: string;
  class: MembershipClass;    // ❌ WRONG - field is named 'tier' in database
  monthly_rate?: number;     // ❌ WRONG - field doesn't exist
  benefits?: Record<string, any>;  // ❌ WRONG
  active: boolean;           // ❌ WRONG - field is named 'is_active'
  start_date: string;
  end_date?: string;
  created_at: string;
}
```

### Database Schema (ACTUAL)
```sql
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES public.user_profiles(id) NOT NULL,  -- not user_id!
  aircraft_id UUID REFERENCES public.aircraft(id),
  tier membership_class NOT NULL,                              -- not class!
  tier_id UUID REFERENCES public.membership_tiers(id),         -- MISSING!
  monthly_credits INTEGER,                                      -- MISSING!
  credits_remaining INTEGER,                                    -- MISSING!
  is_active BOOLEAN DEFAULT true,                              -- not active!
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()                         -- MISSING!
);
```

### Fix Required

**File:** `shared/supabase-types.ts`

Replace lines 33-44 with:

```typescript
export interface Membership {
  id: string;
  owner_id: string;          // ✅ FIXED: was user_id
  aircraft_id?: string;
  tier: MembershipClass;     // ✅ FIXED: was class
  tier_id?: string;          // ✅ ADDED: FK to membership_tiers
  monthly_credits?: number;  // ✅ ADDED: credit allocation
  credits_remaining?: number;// ✅ ADDED: remaining credits
  is_active: boolean;        // ✅ FIXED: was active
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;       // ✅ ADDED: update timestamp
}
```

---

## Issue #2: Document Type Source of Truth

### Problem
Three files define database types with inconsistencies:
1. `client/src/lib/types/database.ts` - ✅ **CORRECT & COMPLETE**
2. `shared/database-types.ts` - ⚠️ Has extra aspirational types
3. `shared/supabase-types.ts` - ❌ Has errors (see Issue #1)

### Recommendation

**Add to README.md:**

```markdown
## Database Types

### Source of Truth
**Use:** `client/src/lib/types/database.ts`

This file contains the auto-generated types from the Supabase schema and is the source of truth for all database operations.

### Other Type Files
- `shared/database-types.ts` - Extended types including aspirational features not yet in database
- `shared/supabase-types.ts` - ⚠️ **DEPRECATED** - Use database.ts instead

### Type Import Pattern
```typescript
// ✅ CORRECT
import { Database } from '@/lib/types/database';
type Aircraft = Database['public']['Tables']['aircraft']['Row'];

// ❌ AVOID
import { Aircraft } from '@/types/supabase-types';
```
```

---

## Issue #3: Clean Up Dead Type Definitions

### Problem
`shared/database-types.ts` defines 45+ interfaces but only 24 tables exist in the database.

### Tables Defined But Don't Exist

**Remove or mark as aspirational:**

```typescript
// Tables that DON'T exist in database:
export interface Service { }                    // ❌ No table
export interface ServiceCredit { }              // ❌ No table
export interface HourBand { }                   // ❌ No table
export interface MembershipPricingRule { }      // ❌ No table
export interface FBO { }                        // ❌ No table
export interface ClientFBOCard { }              // ❌ No table
export interface FuelLog { }                    // ❌ No table
export interface FuelCharge { }                 // ❌ No table
export interface FuelOrder { }                  // ❌ No table
export interface FuelAuthorization { }          // ❌ No table
export interface AircraftFuelStatus { }         // ❌ No table
export interface Document { }                   // ❌ No table
export interface InsurancePolicy { }            // ❌ No table
export interface Reservation { }                // ❌ No table
export interface FlightActivity { }             // ❌ No table
export interface AircraftConsumable { }         // ❌ No table
export interface AircraftPricingOverride { }    // ❌ No table
export interface PricingSnapshot { }            // ❌ No table
export interface Instructor { }                 // ❌ No table (user_profiles.role='cfi' instead)
export interface ActivityLog { }                // ❌ No table
export interface MaintenanceDue { }             // ❌ No table (computed view)
export interface PricingPackage { }             // ❌ No table (legacy?)
```

### Recommended Approach

**Option A: Mark as Aspirational**
Add comment block at top of `shared/database-types.ts`:

```typescript
/**
 * Comprehensive Database Type Definitions
 * 
 * NOTE: This file includes types for:
 * 1. ✅ Current tables (24 tables in production)
 * 2. 🔮 Planned features (marked with @aspirational)
 * 
 * For production code, prefer: client/src/lib/types/database.ts
 */

// ============================================
// CURRENT TABLES (✅ In Production)
// ============================================

export interface UserProfile { ... }
export interface Aircraft { ... }
// ... etc

// ============================================
// ASPIRATIONAL TABLES (🔮 Future Features)
// ============================================

/**
 * @aspirational - Service catalog system
 * Not yet implemented - services currently hardcoded
 */
export interface Service { ... }

/**
 * @aspirational - Fuel management system
 * Not yet implemented
 */
export interface FBO { ... }
// ... etc
```

**Option B: Remove Dead Code**
Delete all interfaces for tables that don't exist and aren't being actively developed.

---

## Issue #4: Add Performance Indexes

### Problem
No indexes found on frequently queried columns (besides PKs and FKs).

### Recommended Indexes

Create file: `scripts/add-performance-indexes.sql`

```sql
-- Performance indexes for Freedom Aviation database
-- Run these to improve query performance

-- Service Requests (heavily filtered by status)
CREATE INDEX IF NOT EXISTS idx_service_requests_status 
  ON service_requests(status);

CREATE INDEX IF NOT EXISTS idx_service_requests_created_at 
  ON service_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_requests_assigned 
  ON service_requests(assigned_to) 
  WHERE assigned_to IS NOT NULL;

-- Invoices (filtered by owner and status)
CREATE INDEX IF NOT EXISTS idx_invoices_owner_status 
  ON invoices(owner_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at 
  ON invoices(created_at DESC);

-- Aircraft (frequently joined on owner)
CREATE INDEX IF NOT EXISTS idx_aircraft_owner 
  ON aircraft(owner_id) 
  WHERE owner_id IS NOT NULL;

-- Flight Logs (filtered by aircraft and date)
CREATE INDEX IF NOT EXISTS idx_flight_logs_aircraft_date 
  ON flight_logs(aircraft_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_flight_logs_pilot 
  ON flight_logs(pilot_id);

-- Maintenance (filtered by aircraft and status)
CREATE INDEX IF NOT EXISTS idx_maintenance_aircraft_status 
  ON maintenance(aircraft_id, status);

-- Memberships (lookup by owner, filter by active)
CREATE INDEX IF NOT EXISTS idx_memberships_owner_active 
  ON memberships(owner_id, is_active);

-- CFI Schedule (lookup by date and CFI)
CREATE INDEX IF NOT EXISTS idx_cfi_schedule_date 
  ON cfi_schedule(date, cfi_id);

CREATE INDEX IF NOT EXISTS idx_cfi_schedule_status 
  ON cfi_schedule(status, date);

-- User Roles (frequently filtered by role type)
CREATE INDEX IF NOT EXISTS idx_user_roles_role 
  ON user_roles(role);

-- Analysis
ANALYZE service_requests;
ANALYZE invoices;
ANALYZE aircraft;
ANALYZE flight_logs;
ANALYZE maintenance;
ANALYZE memberships;
ANALYZE cfi_schedule;

-- Verify indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## Validation Commands

After making fixes, run these to verify:

### 1. Check TypeScript Compilation
```bash
cd client
npm run type-check
```

### 2. Test Database Queries
```bash
# In Supabase SQL Editor or psql:
\d+ memberships  -- Verify schema
SELECT * FROM memberships LIMIT 1;  -- Test query
```

### 3. Run Application
```bash
npm run dev
# Navigate to dashboard and check:
# - Owner dashboard (uses memberships)
# - Staff dashboard (uses service_requests, invoices)
# - Aircraft list (uses aircraft table)
```

---

## Testing Checklist

After applying fixes:

- [ ] TypeScript compiles without errors
- [ ] Owner dashboard loads without console errors
- [ ] Staff dashboard loads membership data correctly
- [ ] Service requests display properly
- [ ] Invoice system works
- [ ] No 404s or 500s in network tab
- [ ] Run `npm run build` successfully

---

## Emergency Rollback

If fixes cause issues:

```bash
# Revert shared/supabase-types.ts
git checkout HEAD -- shared/supabase-types.ts

# Revert any SQL migrations
# In Supabase SQL Editor:
DROP INDEX IF EXISTS idx_service_requests_status;
DROP INDEX IF EXISTS idx_service_requests_created_at;
-- etc for all indexes added
```

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs for query errors
3. Verify RLS policies aren't blocking queries
4. Compare against `client/src/lib/types/database.ts` (source of truth)

---

**End of Quick Fix Guide**

