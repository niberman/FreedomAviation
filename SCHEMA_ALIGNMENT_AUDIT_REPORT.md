# Complete Schema Alignment Audit Report
**Date**: November 20, 2025  
**Auditor**: Cursor AI Assistant  
**Purpose**: Identify ALL schema mismatches before any schema cleanup

---

## Executive Summary

**Status**: ⚠️ CRITICAL - 7 High-Priority Mismatches Found  
**Action Required**: Fix all mismatches before proceeding with schema cleanup

### Key Findings:
1. ✅ **GOOD**: Core tables (user_profiles, aircraft, service_requests, invoices, memberships) are correctly used
2. ❌ **BAD**: 4 deprecated/non-existent tables are still referenced in code
3. ⚠️ **WARNING**: Legacy column names (`hobbs_time`/`tach_time`) still in TypeScript types
4. ⚠️ **WARNING**: Duplicate/inconsistent TypeScript type definitions across 3 files

---

## Part 1: Table Reference Audit

### ✅ Core Tables - CORRECTLY USED

These tables are actively used and properly referenced:

| Table | References | Status | Notes |
|-------|-----------|--------|-------|
| `user_profiles` | Server, Client, Hooks | ✅ CORRECT | Primary user data table |
| `aircraft` | Server, Client, Hooks | ✅ CORRECT | Aircraft inventory |
| `service_requests` | Server, Client, Hooks | ✅ CORRECT | Service workflow |
| `service_tasks` | Types only | ✅ CORRECT | Task management |
| `memberships` | Server, Client | ✅ CORRECT | Membership tracking |
| `maintenance` | Client, Server | ✅ CORRECT | Maintenance schedules |
| `flight_logs` | Client | ✅ CORRECT | Flight history |
| `invoices` | Server, Client | ✅ CORRECT | Billing system |
| `invoice_lines` | Server | ✅ CORRECT | Invoice details |
| `cfi_schedule` | Server, Client | ✅ CORRECT | CFI scheduling |
| `google_calendar_tokens` | Server | ✅ CORRECT | Calendar integration |
| `client_billing_profiles` | Types | ✅ CORRECT | Billing profiles |
| `onboarding_data` | Server | ✅ CORRECT | Onboarding flow |
| `pricing_classes` | Types | ✅ CORRECT | Pricing system |
| `pricing_locations` | Types | ✅ CORRECT | Hangar locations |
| `notification_preferences` | Client | ✅ CORRECT | User notifications |

### ❌ Problematic Tables - POTENTIAL MISMATCHES

#### 1. `support_tickets` ⚠️ HIGH PRIORITY

**Status**: DEPRECATED OR NON-EXISTENT  
**Severity**: HIGH

**References Found**:
```
client/src/pages/login.tsx:199
client/src/components/unified-pricing-calculator.tsx:105
```

**Code Example** (`login.tsx:199`):
```typescript
await supabase.from("support_tickets").insert([{
  owner_id: userData.user.id,
  subject: "Pricing Quote Request",
  body: JSON.stringify({
    aircraft_class: quoteData.aircraft_class,
    monthly_hours: quoteData.monthly_hours,
    monthly_price: quoteData.monthly_price,
    source: "signup_flow",
  }),
  status: "open",
}]);
```

**Issue**: This table may not exist in production schema or is being deprecated. The code attempts to save pricing quotes as support tickets, which is likely incorrect.

**Recommended Fix**: 
- **Option A**: Create `membership_quotes` table and use it instead
- **Option B**: Save to `onboarding_data` table with quote information
- **Option C**: Remove this feature if not needed

**Type Definition Exists**: YES in `shared/database-types.ts:720`

---

#### 2. `consumable_events` ⚠️ MEDIUM PRIORITY

**Status**: DEPRECATED OR NON-EXISTENT  
**Severity**: MEDIUM

**References Found**:
```
client/src/components/aircraft-table.tsx:141
```

**Code Example** (`aircraft-table.tsx:141`):
```typescript
const { error } = await supabase
  .from("consumable_events")
  .insert([
    {
      aircraft_id: aircraft.id,
      kind: "OIL",
      quantity: 2,
      unit: "qt",
      notes: notes || "Top-off request from staff dashboard",
    },
  ]);
```

**Issue**: Table may not exist. Used for tracking oil/fuel consumables.

**Type Definition Exists**: YES in `shared/database-types.ts:234`

**Recommended Fix**:
- **Option A**: If table exists, verify schema matches types
- **Option B**: If not used, remove this code and replace with service_requests
- **Option C**: If needed, create the table properly

---

#### 3. `instruction_requests` ⚠️ MEDIUM PRIORITY

**Status**: MAY BE DEPRECATED  
**Severity**: MEDIUM

**References Found**:
```
client/src/components/request-instruction-sheet.tsx:77
```

**Code Example** (`request-instruction-sheet.tsx:77`):
```typescript
const { error } = await supabase
  .from("instruction_requests")
  .insert({
    student_id: user.id,
    aircraft_id: aircraft.id,
    requested_date: format(date, "yyyy-MM-dd"),
    requested_time: time,
    instruction_type: instructionType,
    duration_hours: parseFloat(duration),
    notes: notes || null,
    status: "pending"
  });
```

**Issue**: This table may be superseded by `service_requests` with type "Flight Instruction"

**Type Definition Exists**: YES in `shared/database-types.ts:705`

**Recommended Fix**:
- **Option A**: Verify if table exists and is actively used
- **Option B**: Migrate to use `service_requests` instead
- **Option C**: If needed, ensure table schema matches type definition

---

#### 4. `email_notifications` ⚠️ LOW PRIORITY

**Status**: USED IN SERVER ONLY  
**Severity**: LOW (likely correct)

**References Found**:
```
server/routes/email-notifications.ts:45, 79, 146
```

**Code Example**:
```typescript
const { data: notifications, error: fetchError } = await supabase
  .from('email_notifications')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: true })
  .limit(50);
```

**Issue**: This table is used in email notification queue system. Likely exists but should be verified.

**Type Definition Exists**: YES in `shared/database-types.ts:668`

**Recommended Fix**: VERIFY table exists in production schema. If not, either:
- Create the table (recommended if email notifications are used)
- OR replace with alternative notification system

---

#### 5. `membership_tiers` ⚠️ MEDIUM PRIORITY

**Status**: REFERENCED BUT MAY NOT EXIST  
**Severity**: MEDIUM

**References Found**:
```
docs/features/pricing.md:307
```

**Issue**: Referenced in documentation but may not exist as a table. Current schema uses `memberships` with a `tier` column (enum) rather than a separate tiers table.

**Type Definition Exists**: YES in `shared/database-types.ts:71`

**Recommended Fix**:
- **Option A**: If using enum-based tiers (recommended), remove this type and update docs
- **Option B**: If separate tiers table is needed, create it and update code

---

## Part 2: Column Name Mismatches

### ❌ CRITICAL: `hobbs_time` / `tach_time` vs `hobbs_hours` / `tach_hours`

**Status**: DEPRECATED COLUMN NAMES STILL IN USE  
**Severity**: CRITICAL

**Issue**: The database previously had duplicate columns. Migration was created to consolidate to `hobbs_hours` and `tach_hours`, but old names still referenced in code.

**Affected Files**:
- `shared/database-types.ts:762-763` - VOwnerAircraft interface
- Migration pending: `migrations/cleanup_aircraft_duplicate_columns.sql`

**Current Code** (`shared/database-types.ts:762`):
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
  hobbs_time?: number;  // ❌ OLD NAME
  tach_time?: number;   // ❌ OLD NAME
}
```

**Correct Types** (`client/src/lib/types/database.ts:58`):
```typescript
hobbs_hours: number | null  // ✅ CORRECT
tach_hours: number | null   // ✅ CORRECT
```

**Recommended Fix**: Update `shared/database-types.ts` to use `hobbs_hours` and `tach_hours`

---

## Part 3: TypeScript Type File Analysis

### Type Definition Files (3 sources)

#### 1. `client/src/lib/types/database.ts` ✅ AUTHORITATIVE

**Status**: CORRECT - This should be the single source of truth  
**Tables Defined**: 10 core tables  
**Quality**: Excellent - Uses Supabase-generated types

**Recommendation**: ✅ USE THIS FILE as primary type source

---

#### 2. `shared/database-types.ts` ⚠️ LEGACY/MIXED

**Status**: MIXED - Contains both current and deprecated types  
**Tables Defined**: 45+ tables  
**Quality**: Medium - Has legacy interfaces and old column names

**Issues**:
- Contains deprecated `hobbs_time`/`tach_time` in VOwnerAircraft
- Defines tables that may not exist (support_tickets, membership_tiers, etc.)
- Duplicates types already in client/src/lib/types/database.ts

**Recommendation**: ⚠️ REFACTOR or DEPRECATE this file

---

#### 3. `shared/supabase-types.ts` ⚠️ SIMPLIFIED

**Status**: SIMPLIFIED - Basic types only  
**Tables Defined**: 7 core tables  
**Quality**: Good but minimal

**Recommendation**: MERGE into client/src/lib/types/database.ts or deprecate

---

## Part 4: React Query Hooks Analysis

### Hooks Audited (✅ ALL CORRECT)

1. **`useServiceRequests.ts`** ✅
   - Tables: `service_requests`
   - Status: CORRECT - All queries valid

2. **`useAircraft.ts`** ✅
   - Tables: `aircraft`
   - Columns: Uses `hobbs_hours`, `tach_hours` ✅
   - Status: CORRECT - All queries valid

3. **`useUserProfile.ts`** ✅
   - Tables: `user_profiles`
   - Status: CORRECT - All queries valid

**Summary**: All React Query hooks are correctly written and use proper column names.

---

## Part 5: Server-Side Code Analysis

### API Routes Audited

**Files Checked**:
- `server/routes.ts` (2,237 lines) ✅
- `server/routes/email-notifications.ts` (310 lines) ⚠️

**Tables Accessed by Server**:
- `user_profiles` ✅
- `aircraft` ✅
- `service_requests` ✅
- `invoices` ✅
- `invoice_lines` ✅
- `google_calendar_tokens` ✅
- `cfi_schedule` ✅
- `onboarding_data` ✅
- `email_notifications` ⚠️ (verify exists)
- `memberships` ✅

**Issues Found**:
1. `email_notifications` table used but may not exist (server/routes/email-notifications.ts)

---

## Part 6: Migration Status

### Pending Migrations

#### 1. `cleanup_aircraft_duplicate_columns.sql` ⚠️ READY

**Purpose**: Remove `hobbs_time`/`tach_time` columns  
**Status**: Ready but NOT executed  
**Risk**: Low - Migration includes data preservation  

**Action**: EXECUTE in staging first

---

#### 2. `resolve_user_roles_duplication.sql` ⚠️ READY

**Purpose**: Consolidate user role system  
**Status**: Ready but NOT executed  
**Risk**: Medium - Affects authentication  

**Action**: EXECUTE after testing

---

## Part 7: Summary of Mismatches

### Critical Issues (Must Fix Before Schema Cleanup)

1. **`support_tickets` table** - Used in 2 places but may not exist
2. **`hobbs_time`/`tach_time`** - Deprecated column names in shared types
3. **Type file duplication** - 3 different type files with conflicting definitions

### Medium Priority Issues

4. **`consumable_events` table** - Used in 1 place but may not exist
5. **`instruction_requests` table** - Used in 1 place, may be deprecated
6. **`membership_tiers` table** - Referenced but may not exist

### Low Priority Issues

7. **`email_notifications` table** - Verify exists (likely does)

---

## Part 8: Recommended Action Plan

### Phase 1: Immediate Fixes (DO THIS FIRST) ⚠️

1. **Fix `support_tickets` references**
   ```bash
   # Files to update:
   - client/src/pages/login.tsx:199
   - client/src/components/unified-pricing-calculator.tsx:105
   ```
   
   Replace with `membership_quotes` table or remove feature

2. **Fix `consumable_events` reference**
   ```bash
   # File to update:
   - client/src/components/aircraft-table.tsx:141
   ```
   
   Either create table or replace with service_requests

3. **Fix `instruction_requests` reference**
   ```bash
   # File to update:
   - client/src/components/request-instruction-sheet.tsx:77
   ```
   
   Migrate to use service_requests or verify table exists

4. **Update `VOwnerAircraft` interface**
   ```bash
   # File to update:
   - shared/database-types.ts:762-763
   ```
   
   Change `hobbs_time` → `hobbs_hours`, `tach_time` → `tach_hours`

### Phase 2: Type System Consolidation

5. **Consolidate TypeScript types**
   - Make `client/src/lib/types/database.ts` the single source of truth
   - Deprecate or refactor `shared/database-types.ts`
   - Remove `shared/supabase-types.ts` or merge with main types

### Phase 3: Verification

6. **Verify `email_notifications` table exists**
   - If not, create it or replace email notification system

7. **Execute pending migrations**
   - Run `cleanup_aircraft_duplicate_columns.sql` on staging
   - Run `resolve_user_roles_duplication.sql` on staging
   - Test thoroughly
   - Deploy to production

### Phase 4: Schema Cleanup (ONLY AFTER ABOVE)

8. **Remove unused tables** (if confirmed unused):
   - `support_tickets` (if not created)
   - `consumable_events` (if not created)
   - `instruction_requests` (if migrated to service_requests)
   - `membership_tiers` (if using enum-based system)

---

## Part 9: Files Requiring Changes

### High Priority Changes

```
✅ MUST FIX:
├── client/src/pages/login.tsx                          (support_tickets)
├── client/src/components/unified-pricing-calculator.tsx (support_tickets)
├── client/src/components/aircraft-table.tsx            (consumable_events)
├── client/src/components/request-instruction-sheet.tsx (instruction_requests)
└── shared/database-types.ts                            (hobbs_time/tach_time)
```

### Medium Priority Changes

```
⚠️ SHOULD FIX:
├── server/routes/email-notifications.ts                (verify email_notifications table)
└── docs/features/pricing.md                            (membership_tiers reference)
```

### Type System Refactoring

```
🔧 REFACTOR:
├── client/src/lib/types/database.ts                    (keep as-is)
├── shared/database-types.ts                            (refactor or deprecate)
└── shared/supabase-types.ts                            (merge or deprecate)
```

---

## Part 10: Verification Checklist

### Before Making Any Changes

- [ ] Screenshot/document actual Supabase schema
- [ ] Backup production database
- [ ] Create staging environment

### After Fixes

- [ ] Run TypeScript compiler: `npm run build`
- [ ] Run tests: `npm test`
- [ ] Manual testing of affected features:
  - [ ] Pricing quote requests (login flow)
  - [ ] Unified pricing calculator
  - [ ] Aircraft consumable tracking
  - [ ] Flight instruction requests
  - [ ] Email notifications
- [ ] Verify all queries work in staging
- [ ] Check browser console for errors

### Before Schema Cleanup

- [ ] All code references updated
- [ ] All type definitions corrected
- [ ] All tests passing
- [ ] Staging environment tested
- [ ] Migrations executed successfully

---

## Conclusion

**Status**: ⚠️ Repository is NOT schema-aligned  
**Priority**: HIGH - Fix before schema cleanup  
**Estimated Effort**: 2-4 hours for code fixes, 1 hour for testing

**Next Steps**:
1. Review this report with team
2. Confirm which tables should/shouldn't exist
3. Execute Phase 1 fixes (immediate fixes)
4. Test thoroughly
5. Execute Phase 2-3 (consolidation & verification)
6. ONLY THEN proceed with schema cleanup

**CRITICAL**: Do NOT delete any tables until all code references are fixed and tested.

---

**End of Report**  
**Generated**: November 20, 2025  
**For**: Freedom Aviation Schema Alignment Audit

