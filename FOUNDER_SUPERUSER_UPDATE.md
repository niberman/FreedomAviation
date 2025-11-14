# Founder Role Superuser Update

## Overview
This document summarizes the changes made to ensure the `founder` role has complete superuser access across the entire Freedom Aviation application.

## Changes Made

### ✅ 1. Database RLS Policies Updated (`supabase-schema.sql`)

All Row-Level Security (RLS) policies have been updated to include `founder` role alongside `admin`:

#### **User Profiles**
- ✅ View all profiles: `admin`, `staff`, `founder`
- ✅ Update all profiles: `admin`, `founder`

#### **Aircraft**
- ✅ View all aircraft: `admin`, `staff`, `founder`  
- ✅ Insert aircraft: `admin`, `founder`
- ✅ Update any aircraft: `admin`, `founder`
- ✅ Delete aircraft: `admin`, `founder`

#### **Memberships**
- ✅ View all memberships: `admin`, `founder`

#### **Maintenance**
- ✅ View all maintenance: `admin`, `staff`, `founder`
- ✅ Insert maintenance: `admin`, `staff`, `founder`
- ✅ Update maintenance: `admin`, `staff`, `founder`
- ✅ Delete maintenance: `admin`, `founder`

#### **Consumable Events**
- ✅ View all events: `admin`, `staff`, `founder`
- ✅ Insert events: `admin`, `staff`, `founder`
- ✅ Update events: `admin`, `staff`, `founder`
- ✅ Delete events: `admin`, `founder`

#### **Service Requests**
- ✅ View all requests: `admin`, `staff`, `founder`, `ops`, `cfi`
- ✅ Update requests: `admin`, `staff`, `founder`, `ops`, `cfi`
- ✅ Delete requests: `admin`, `founder`

#### **Service Tasks**
- ✅ View all tasks: `admin`, `staff`, `founder`, `ops`, `cfi`
- ✅ Insert tasks: `admin`, `staff`, `founder`, `ops`, `cfi`
- ✅ Update tasks: `admin`, `staff`, `founder`, `ops`, `cfi`
- ✅ Delete tasks: `admin`, `founder`

#### **Invoices**
- ✅ View all invoices: `admin`, `staff`, `founder`
- ✅ Create instruction invoices: `admin`, `staff`, `cfi`, `founder`
- ✅ Manage all invoices: `admin`, `founder`

#### **Invoice Lines**
- ✅ View invoice lines: `admin`, `staff`, `founder`
- ✅ Insert invoice lines: `admin`, `staff`, `cfi`, `founder`
- ✅ Manage all invoice lines: `admin`, `founder`

### ✅ 2. RPC Functions Updated

#### **`create_instruction_invoice()`**
- Now recognizes `founder` role
- Founders can create invoices on behalf of any CFI
- Updated error messages to include founders

#### **`finalize_invoice()`**
- Now recognizes `founder` role
- Founders can finalize any instruction invoice
- Updated authorization checks

### ✅ 3. Type Definitions Updated

#### **`/shared/database-types.ts`**
```typescript
export type UserRole = 'owner' | 'staff' | 'cfi' | 'admin' | 'ops' | 'founder';
```

#### **`/shared/supabase-types.ts`**
```typescript
export type UserRole = 'owner' | 'cfi' | 'staff' | 'admin' | 'ops' | 'founder';
```

Both files were missing `ops` and `founder` - now fixed!

### ✅ 4. Frontend Role Checking (Already Correct)

The frontend role checking functions in `/client/src/lib/roles.ts` already properly include `founder`:

```typescript
const STAFF_ROLES = new Set(['admin', 'cfi', 'staff', 'ops', 'founder']);

export function isStaffRole(role): boolean
  // Returns true for: admin, cfi, staff, ops, founder

export function isOpsRole(role): boolean
  // Returns true for: ops, founder, admin

export function isCfiRole(role): boolean
  // Returns true for: cfi, founder, admin

export function isAdminRole(role): boolean
  // Returns true for: admin, founder

export function isFounderRole(role): boolean
  // Returns true for: founder
```

### ✅ 5. Server Route Permissions (Already Correct)

Backend routes in `/server/routes.ts` already include `founder` in all permission checks:

- **Line 232**: Google Calendar - `["admin", "cfi", "founder", "ops"]`
- **Line 1489**: Service Requests - `["admin", "cfi", "staff", "founder", "ops"]`
- **Line 1541**: Service Request Updates - `["admin", "cfi", "staff", "founder", "ops"]`
- **Line 1585**: Google Calendar Integration - `["admin", "cfi", "founder"]`

## Migration Script

A migration script has been created at:
```
/migrations/add_founder_to_all_policies.sql
```

This script can be run in Supabase SQL Editor to update the live database with all the changes above.

## How to Apply Changes

### For Development (Schema File)
The changes are already in `supabase-schema.sql`. Any new database created from this schema will have founder as a superuser.

### For Production/Existing Database
Run the migration script in Supabase SQL Editor:
```bash
cat migrations/add_founder_to_all_policies.sql
```

Copy and paste the contents into Supabase SQL Editor and execute.

## Verification

To verify founder has access, run this query in Supabase:

```sql
-- Check all policies include founder
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'aircraft', 'service_requests', 'invoices')
  AND (qual LIKE '%founder%' OR qual LIKE '%admin%')
ORDER BY tablename, policyname;
```

## Role Hierarchy Summary

```
founder (SUPERUSER)
  ├── Has ALL permissions of admin
  ├── Has ALL permissions of cfi  
  ├── Has ALL permissions of ops
  └── Has ALL permissions of staff

admin
  ├── Full CRUD on most tables
  └── Cannot override founder

cfi (Certified Flight Instructor)
  ├── Can create/manage instruction invoices
  ├── Can connect Google Calendar
  └── Can manage service requests

ops (Operations Staff)
  ├── Can manage service requests
  ├── Can view/update service tasks
  └── Receives service request notifications

staff (General Staff)
  ├── Can view all profiles
  └── Can manage maintenance and service data

owner (Aircraft Owner)
  └── Can manage own aircraft and data
```

## Testing Checklist

To verify founder has full access, test:

- [ ] View all user profiles
- [ ] Update any user profile (including role changes)
- [ ] View, create, update, delete aircraft
- [ ] View, create, update, delete service requests
- [ ] View, create, update, delete service tasks
- [ ] View, create, update, delete invoices
- [ ] Create instruction invoices for any CFI
- [ ] Finalize any invoice
- [ ] Connect Google Calendar integration
- [ ] Access staff portal
- [ ] Access admin portal

## Files Modified

1. ✅ `/supabase-schema.sql` - All RLS policies updated
2. ✅ `/shared/database-types.ts` - Added `ops` and `founder` to UserRole
3. ✅ `/shared/supabase-types.ts` - Added `ops` and `founder` to UserRole
4. ✅ `/migrations/add_founder_to_all_policies.sql` - New migration script

## Files Verified (Already Correct)

1. ✅ `/client/src/lib/roles.ts` - Role checking functions include founder
2. ✅ `/server/routes.ts` - All permission checks include founder
3. ✅ `/client/src/lib/types/database.ts` - UserRole includes all 6 roles
4. ✅ `/client/src/components/staff-protected-route.tsx` - Uses isStaffRole() which includes founder

## Summary

✅ **Founder now has complete superuser access to:**
- All database tables (via RLS policies)
- All RPC functions
- All backend API endpoints
- All frontend components
- All admin and staff features

🔒 **Security Note:** Only assign the `founder` role to trusted individuals with full system access. This role bypasses most restrictions and has elevated privileges across the entire application.




