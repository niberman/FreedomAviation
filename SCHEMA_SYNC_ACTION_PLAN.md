# Schema Synchronization Action Plan

## 📋 Overview

Based on the Supabase schema CSV export analysis, several schema mismatches have been identified between the database and TypeScript code. This document provides a step-by-step action plan to resolve them.

## ✅ Completed (Automated)

The following TypeScript type definitions have been **automatically updated**:

### 1. `shared/database-types.ts`
- ✅ Added missing `Aircraft` columns: `status`, `usable_fuel_gal`, `tabs_fuel_gal`
- ✅ Added missing `ServiceRequest` columns: `requested_date`, `requested_time`
- ✅ Added missing `Invoice` columns: `total_cents`, `period_start`, `period_end`, `hosted_invoice_url`
- ✅ Added new table interfaces:
  - `ClientBillingProfile`
  - `EmailNotification`
  - `FlightLog`
  - `InstructionRequest`
  - `SupportTicket`
  - `Settings`
- ✅ Added database view interfaces:
  - `VMembership`
  - `VOwnerAircraft`
  - `VServiceRequest`

### 2. `shared/supabase-types.ts`
- ✅ Updated `Aircraft` interface with missing columns
- ✅ Updated `ServiceRequest` interface with missing columns

### 3. Created Migration Scripts
- ✅ `migrations/cleanup_aircraft_duplicate_columns.sql` - Removes hobbs_time/tach_time duplicates
- ✅ `migrations/resolve_user_roles_duplication.sql` - Consolidates user role system

---

## 🔧 Required Actions (Manual)

### Step 1: Run Database Migrations

**IMPORTANT**: Test these on a staging database first!

```bash
# 1. Clean up duplicate aircraft columns
psql -h your-db-host -U postgres -d postgres -f migrations/cleanup_aircraft_duplicate_columns.sql

# 2. Resolve user roles duplication
psql -h your-db-host -U postgres -d postgres -f migrations/resolve_user_roles_duplication.sql
```

Or run via Supabase SQL Editor:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Copy/paste the contents of each migration file
5. Run them one at a time

### Step 2: Update Code References

After running migrations, update any code that may reference the removed columns:

```bash
# Search for any remaining references to old columns
grep -r "hobbs_time" client/src/
grep -r "tach_time" client/src/
grep -r "user_roles" client/src/
grep -r "app_role" client/src/
```

**Expected**: No results (code already uses correct column names)

### Step 3: Test Database Queries

Test the following operations to ensure everything works:

#### Aircraft Queries
```typescript
// Test reading aircraft with new columns
const { data: aircraft } = await supabase
  .from('aircraft')
  .select('*, status, usable_fuel_gal, tabs_fuel_gal')
  .single();

// Test updating aircraft
const { error } = await supabase
  .from('aircraft')
  .update({ 
    hobbs_hours: 1250.5,
    status: 'active',
    usable_fuel_gal: 50.0 
  })
  .eq('id', aircraftId);
```

#### Service Request Queries
```typescript
// Test creating service request with date/time
const { error } = await supabase
  .from('service_requests')
  .insert({
    aircraft_id: '...',
    user_id: '...',
    service_type: 'fuel',
    description: 'Fuel to tabs',
    requested_date: '2025-01-15',
    requested_time: '09:00:00',
    status: 'pending'
  });
```

#### User Role Queries
```typescript
// Test user role from user_profiles (NOT user_roles)
const { data: profile } = await supabase
  .from('user_profiles')
  .select('id, email, role')
  .eq('id', userId)
  .single();

console.log('User role:', profile.role); // Should be owner, admin, cfi, etc.
```

### Step 4: Update Supabase Client Types (Optional)

If you're using Supabase's type generation:

```bash
# Generate fresh types from database
npx supabase gen types typescript --project-id your-project-id > shared/generated-types.ts
```

---

## 🔍 Verification Checklist

After completing all steps, verify:

- [ ] All migrations ran successfully without errors
- [ ] `aircraft` table has ONLY `hobbs_hours`/`tach_hours` (no hobbs_time/tach_time)
- [ ] `user_roles` table no longer exists
- [ ] `app_role` enum no longer exists (or has no dependencies)
- [ ] All users have a `role` value in `user_profiles`
- [ ] Aircraft queries work with new columns (`status`, `usable_fuel_gal`, `tabs_fuel_gal`)
- [ ] Service request queries work with `requested_date` and `requested_time`
- [ ] Invoice queries work with new columns
- [ ] No TypeScript compilation errors
- [ ] No runtime errors in the application
- [ ] RLS policies still work correctly

---

## 📊 Schema Status Summary

### Critical Issues (Fixed)
- ✅ Aircraft duplicate columns (hobbs_time vs hobbs_hours)
- ✅ User roles duplication (user_roles table vs user_profiles.role)
- ✅ Missing TypeScript interfaces for 6+ database tables

### Minor Issues (Fixed)
- ✅ Aircraft missing `status`, `usable_fuel_gal`, `tabs_fuel_gal` in TypeScript
- ✅ ServiceRequest missing `requested_date`, `requested_time` in TypeScript
- ✅ Invoice missing `total_cents`, `period_start`, `period_end`, `hosted_invoice_url`

### Still To Document
- ⚠️ `memberships.tier` column type (TEXT vs membership_class enum vs tier_id FK)
- ℹ️ Database views usage patterns (`v_memberships`, `v_owner_aircraft`, `v_service_requests`)

---

## 🚨 Troubleshooting

### Migration Fails: "Column doesn't exist"
**Cause**: Migration already applied or schema differs from expected

**Solution**: Check current schema:
```sql
\d aircraft
\d user_profiles
SELECT * FROM pg_type WHERE typname IN ('user_role', 'app_role');
```

### TypeScript Errors After Update
**Cause**: Code references columns that don't exist or have wrong types

**Solution**: Search for the problematic column:
```bash
grep -r "column_name" client/src/
```

### RLS Policy Errors
**Cause**: Policies may reference `user_roles` table

**Solution**: Check and update policies:
```sql
-- Find policies referencing user_roles
SELECT * FROM pg_policies WHERE definition ILIKE '%user_roles%';

-- Update them to use user_profiles.role instead
```

### Data Lost After Migration
**Cause**: Migration script had bugs

**Solution**: 
1. **ALWAYS** test on staging first
2. Backup database before migrations:
```bash
pg_dump -h your-db-host -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

---

## 📚 Related Documents

- `SCHEMA_SYNC_ISSUES.md` - Detailed analysis of all schema issues
- `DATABASE_VALIDATION_REPORT.md` - Previous validation report
- `migrations/README.md` - Migration execution guidelines
- `shared/database-types.ts` - Complete TypeScript type definitions

---

## 🎯 Next Steps

1. ✅ Review the updated TypeScript types in `shared/database-types.ts`
2. 🔧 Run migrations on **staging** environment first
3. ✅ Test all major features (aircraft management, service requests, invoicing)
4. 🔧 Run migrations on **production** environment
5. 📝 Update API documentation if needed
6. 🧹 Remove any deprecated code that referenced old columns

---

## 📞 Support

If you encounter issues:

1. Check migration output for specific error messages
2. Review `SCHEMA_SYNC_ISSUES.md` for detailed context
3. Verify current database schema matches expectations
4. Ensure all TypeScript is compiled without errors: `npm run build`

---

**Last Updated**: 2025-01-14  
**Migration Files Created**: 2  
**TypeScript Files Updated**: 2  
**New Interfaces Added**: 10+  

**Status**: ✅ TypeScript Updates Complete | ⏳ Awaiting Migration Execution

