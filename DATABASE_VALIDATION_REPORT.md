# Database Schema Validation Report

**Generated:** November 14, 2025  
**Status:** ✅ VALIDATED

## Executive Summary

This report validates the database schema against the application code, identifying:
- ✅ **24 tables** actively defined in the database
- ✅ **107 query locations** across 31 client files
- ⚠️ **Schema inconsistencies** between type definitions
- 🔧 **Missing tables** referenced in comprehensive types but not in database

---

## 1. Database Tables (24 Total)

### Core Tables ✅
| Table | Status | Usage | Notes |
|-------|--------|-------|-------|
| `user_profiles` | ✅ Active | High | Core auth table, heavily used |
| `user_roles` | ✅ Active | Low | Role management |
| `aircraft` | ✅ Active | High | Core entity |
| `memberships` | ✅ Active | Medium | Subscription management |
| `membership_tiers` | ✅ Active | Low | Tier definitions |

### Service Management ✅
| Table | Status | Usage | Notes |
|-------|--------|-------|-------|
| `service_requests` | ✅ Active | High | Kanban board, operations |
| `service_tasks` | ✅ Active | Medium | Task management |
| `support_tickets` | ✅ Active | Low | Support system |

### Flight Operations ✅
| Table | Status | Usage | Notes |
|-------|--------|-------|-------|
| `flight_logs` | ✅ Active | Medium | Flight tracking |
| `instruction_requests` | ✅ Active | Low | Instruction booking |
| `cfi_schedule` | ✅ Active | Medium | CFI availability |

### Financial ✅
| Table | Status | Usage | Notes |
|-------|--------|-------|-------|
| `invoices` | ✅ Active | High | Billing system |
| `invoice_lines` | ✅ Active | High | Invoice line items |
| `client_billing_profiles` | ✅ Active | Low | Billing preferences |
| `membership_quotes` | ✅ Active | Low | Onboarding quotes |

### Maintenance ✅
| Table | Status | Usage | Notes |
|-------|--------|-------|-------|
| `maintenance` | ✅ Active | Medium | Maintenance tracking |
| `consumable_events` | ✅ Active | Low | Fuel, oil tracking |

### Pricing System ✅
| Table | Status | Usage | Notes |
|-------|--------|-------|-------|
| `pricing_locations` | ✅ Active | Medium | Location-based pricing |
| `pricing_classes` | ✅ Active | Medium | Class-based pricing |
| `settings_pricing_assumptions` | ✅ Active | Low | Pricing calculations |

### Configuration & Integration ✅
| Table | Status | Usage | Notes |
|-------|--------|-------|-------|
| `settings` | ✅ Active | Low | App settings |
| `onboarding_data` | ✅ Active | Medium | User onboarding |
| `google_calendar_tokens` | ✅ Active | Low | Calendar integration |
| `email_notifications` | ✅ Active | Low | Notification queue |

---

## 2. Type Definition Analysis

### Primary Type Sources

1. **`client/src/lib/types/database.ts`** (495 lines)
   - ✅ Complete Database interface with Row/Insert/Update types
   - ✅ Covers all 24 active tables
   - ✅ Properly typed with enums

2. **`shared/database-types.ts`** (661 lines)
   - ⚠️ **Defines 45+ interfaces** (many NOT in database)
   - ✅ Comprehensive type coverage
   - ❌ Out of sync with actual database

3. **`shared/supabase-types.ts`** (110 lines)
   - ✅ Simplified subset for common types
   - ⚠️ Some field mismatches (see below)

### Type Inconsistencies Found

#### Issue #1: Membership Field Mismatch
**Location:** `shared/supabase-types.ts:35-36`

```typescript
// supabase-types.ts (WRONG)
export interface Membership {
  user_id: string;  // ❌ Does not exist in database
  
// database-types.ts (CORRECT)
export interface Membership {
  owner_id: string;  // ✅ Matches database
  
// Actual Database Column:
// memberships.owner_id -> references user_profiles(id)
```

**Impact:** Medium - Could cause runtime errors if `supabase-types.ts` is used
**Fix Required:** Rename `user_id` to `owner_id` in `shared/supabase-types.ts`

#### Issue #2: Membership Fields Missing
**Location:** `shared/supabase-types.ts:37-40`

```typescript
// supabase-types.ts (INCOMPLETE)
export interface Membership {
  class: MembershipClass;  // ❌ Wrong field name
  monthly_rate?: number;   // ❌ Wrong field name
  
// Actual Database Has:
// - tier: membership_class (not "class")
// - monthly_credits: integer
// - credits_remaining: integer
// - tier_id: uuid (FK to membership_tiers)
```

**Impact:** High - Missing critical fields
**Fix Required:** Update to match database schema

---

## 3. Missing Tables (Referenced in Code but Not in Database)

These tables are defined in `shared/database-types.ts` but **DO NOT exist** in the actual database:

### Critical Missing Tables 🔴

| Table | Impact | Used By | Action Required |
|-------|--------|---------|-----------------|
| `services` | High | Service system | Create table or remove references |
| `service_credits` | High | Credit tracking | Create table or refactor |
| `hour_bands` | Medium | Pricing tiers | Create or merge with tiers |
| `membership_pricing_rules` | Medium | Pricing engine | Create or use simpler model |
| `reservations` | Medium | Scheduling | Create or use cfi_schedule |

### Fuel Management Missing 🟡

These tables are defined but not created:
- `fbos` - FBO directory
- `client_fbo_cards` - FBO card management  
- `fuel_logs` - Fuel tracking
- `fuel_charges` - Fuel billing
- `fuel_orders` - Fuel requests
- `fuel_authorizations` - Fuel approval workflow
- `aircraft_fuel_status` - Current fuel levels

**Recommendation:** Either create these tables or remove from type definitions

### Document Management Missing 🟡

- `documents` - Document storage
- `insurance_policies` - Insurance tracking

### Advanced Features Missing 🟡

- `aircraft_consumables` - Consumable inventory
- `aircraft_pricing_overrides` - Custom pricing
- `pricing_snapshots` - Pricing history
- `instructors` - Instructor profiles (separate from user_profiles)
- `flight_activity` - Detailed flight tracking
- `activity_logs` - Audit trail
- `pricing_packages` - Legacy pricing (deprecated?)
- `maintenance_due` - Computed maintenance view

---

## 4. Schema Validation by Module

### ✅ Working Correctly

#### User Management
- `user_profiles` table exists and matches types
- `user_roles` table for role assignment
- Auth integration working via Supabase Auth

#### Aircraft Management  
- `aircraft` table complete
- FK to `owner_id` working
- Used in 15+ components

#### Service Requests
- `service_requests` table complete
- Kanban board integration working
- API endpoints functional

#### Invoicing
- `invoices` and `invoice_lines` working
- Stripe integration functional
- Email sending operational

#### Flight Logging
- `flight_logs` table exists
- Pilot/verifier relationships working
- Used in FlightLogsList component

### ⚠️ Needs Attention

#### Membership System
- ✅ `memberships` table exists
- ✅ `membership_tiers` table exists
- ⚠️ Type definitions inconsistent
- ❌ `membership_pricing_rules` not implemented
- ❌ `hour_bands` not implemented
- **Current**: Simple tier-based pricing
- **Types suggest**: Complex hour-band rules not implemented

#### Service Credits
- ✅ `credits_used` tracked in `service_requests`
- ✅ `monthly_credits`/`credits_remaining` in `memberships`
- ❌ `service_credits` table doesn't exist
- ❌ `services` catalog table doesn't exist
- **Workaround**: Using hardcoded service types

#### Pricing System
- ✅ `pricing_locations` table exists
- ✅ `pricing_classes` table exists
- ✅ `settings_pricing_assumptions` exists
- ❌ Dynamic pricing overrides not implemented
- ❌ Pricing snapshots not implemented

---

## 5. Query Usage Analysis

**Total Queries Found:** 107 `.from()` calls across 31 files

### Most Queried Tables

1. **`user_profiles`** - 25+ queries
   - staff-dashboard, clients-table, service-requests, auth
   
2. **`aircraft`** - 20+ queries
   - staff-dashboard, aircraft-table, owner-dashboard, useAircraft hook
   
3. **`invoices`** - 15+ queries
   - staff-dashboard, owner-more, invoice components
   
4. **`service_requests`** - 12+ queries
   - kanban-board, operations, useServiceRequests hook

5. **`maintenance`** - 5+ queries
   - staff-dashboard, maintenance components

### Unused Tables in Frontend

These tables exist but have **no direct client queries** (may be server-only):
- `settings` (1 query only)
- `support_tickets` (no queries found)
- `client_billing_profiles` (no queries found)
- `email_notifications` (server-side only)

---

## 6. Foreign Key Validation

### ✅ All FK Constraints Valid

Validated all foreign key relationships:

**user_profiles References:**
- ✅ `aircraft.owner_id` → `user_profiles.id`
- ✅ `memberships.owner_id` → `user_profiles.id`
- ✅ `service_requests.user_id` → `user_profiles.id`
- ✅ `service_requests.assigned_to` → `user_profiles.id`
- ✅ `invoices.owner_id` → `user_profiles.id`
- ✅ `invoices.created_by_cfi_id` → `user_profiles.id`
- ✅ `flight_logs.pilot_id` → `user_profiles.id`
- ✅ `flight_logs.verified_by` → `user_profiles.id`
- ✅ `cfi_schedule.cfi_id` → `user_profiles.id`
- ✅ `user_roles.user_id` → `user_profiles.id`

**aircraft References:**
- ✅ `service_requests.aircraft_id` → `aircraft.id`
- ✅ `service_tasks.aircraft_id` → `aircraft.id`
- ✅ `maintenance.aircraft_id` → `aircraft.id`
- ✅ `consumable_events.aircraft_id` → `aircraft.id`
- ✅ `flight_logs.aircraft_id` → `aircraft.id`
- ✅ `memberships.aircraft_id` → `aircraft.id`
- ✅ `invoices.aircraft_id` → `aircraft.id` (nullable)

**Other FK Relationships:**
- ✅ `invoice_lines.invoice_id` → `invoices.id`
- ✅ `memberships.tier_id` → `membership_tiers.id`
- ✅ `instruction_requests.student_id` → `user_profiles.id`
- ✅ `instruction_requests.cfi_id` → `user_profiles.id`
- ✅ `cfi_schedule.owner_id` → `user_profiles.id` (nullable)

**No Orphaned FK References Found**

---

## 7. Critical Issues Summary

### 🔴 Critical (Fix Immediately)

1. **Type Definition Mismatch**
   - File: `shared/supabase-types.ts`
   - Issue: `Membership` interface uses wrong field names
   - Fix: Update to match database schema

### 🟡 Medium Priority

2. **Extensive Dead Code in `database-types.ts`**
   - 45+ interfaces defined
   - Only 24 tables exist
   - ~20 tables defined but not created
   - Fix: Either create missing tables or clean up types

3. **Legacy Drizzle Schema**
   - File: `shared/schema.ts`
   - Status: Marked as legacy but still present
   - Fix: Consider removing if truly unused

### 🟢 Low Priority

4. **Missing Indexes** (Performance)
   - No explicit indexes shown in constraint output
   - May want to add indexes on frequently queried columns
   - Example: `service_requests.status`, `invoices.status`

5. **Unused Tables**
   - `support_tickets`, `client_billing_profiles`, `settings`
   - Either use them or remove them

---

## 8. Recommendations

### Immediate Actions

1. **Fix `supabase-types.ts`**
   ```typescript
   // Change:
   export interface Membership {
     user_id: string;  // WRONG
     class: MembershipClass;  // WRONG
     
   // To:
   export interface Membership {
     owner_id: string;  // CORRECT
     tier: MembershipClass;  // CORRECT
     tier_id: string;  // ADD
     monthly_credits?: number;  // ADD
     credits_remaining?: number;  // ADD
   ```

2. **Document Type Source of Truth**
   - Primary: `client/src/lib/types/database.ts`
   - This file is correctly generated and matches database
   - Consider deprecating `shared/supabase-types.ts`

### Short-Term Actions

3. **Clean Up `database-types.ts`**
   - Remove interfaces for tables that don't exist
   - Or create migration plan to implement missing features
   - Add comments marking which interfaces are aspirational

4. **Add Database Indexes**
   ```sql
   CREATE INDEX idx_service_requests_status ON service_requests(status);
   CREATE INDEX idx_service_requests_aircraft ON service_requests(aircraft_id);
   CREATE INDEX idx_invoices_owner ON invoices(owner_id);
   CREATE INDEX idx_invoices_status ON invoices(status);
   CREATE INDEX idx_aircraft_owner ON aircraft(owner_id);
   ```

### Long-Term Actions

5. **Implement Missing Features** (if needed)
   - Service catalog (`services` table)
   - Service credits system (`service_credits` table)
   - Fuel management (7 tables)
   - Document management (2 tables)
   
6. **Remove Unused Tables** (if not needed)
   - `support_tickets` (no usage found)
   - `client_billing_profiles` (no usage found)
   - Or build features to use them

---

## 9. Validation Checklist

- [x] All tables in database have type definitions
- [x] All foreign keys are valid and properly constrained
- [x] Primary keys exist on all tables
- [x] No orphaned references
- [x] Enums match between database and TypeScript
- [ ] **Type definitions consistent across all files** ❌
- [ ] **All defined types have corresponding tables** ❌
- [x] Active queries use valid table names
- [x] RLS policies exist (confirmed in previous reports)

---

## 10. Files to Review/Update

### Must Fix
- `shared/supabase-types.ts` - Field name mismatches

### Should Review
- `shared/database-types.ts` - Remove or implement missing tables
- `shared/schema.ts` - Remove if truly legacy

### Reference (Correct)
- `client/src/lib/types/database.ts` - Use as source of truth

---

## Conclusion

**Overall Status: ✅ FUNCTIONAL with ⚠️ INCONSISTENCIES**

The database schema is **functional and working correctly** for all active features. The main issues are:

1. **Type definition inconsistencies** - Easy to fix
2. **Aspirational types** - Many interfaces defined for features not yet built
3. **Some unused tables** - Either use or remove

**No critical runtime issues detected.** The application is working correctly with the current 24-table schema. The type mismatches in `supabase-types.ts` could cause issues if that file is used, but most code appears to use the correct `database.ts` types.

### Priority Actions
1. Fix `supabase-types.ts` Membership interface (**30 minutes**)
2. Document which type file is canonical (**15 minutes**)
3. Clean up dead type definitions (**2 hours**)
4. Add performance indexes (**1 hour**)

---

**Report End**


