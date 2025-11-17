# Freedom Aviation - Complete Context for Cursor AI

**Last Updated**: November 14, 2025  
**Purpose**: Master reference document for AI assistants working on this codebase  
**Status**: ✅ Production - Actively Maintained

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [User System & Authentication](#user-system--authentication)
3. [Database Architecture](#database-architecture)
4. [Known Issues & Constraints](#known-issues--constraints)
5. [Recent Changes & Migrations](#recent-changes--migrations)
6. [Email & Communication](#email--communication)
7. [Development Workflow](#development-workflow)
8. [Critical Dependencies](#critical-dependencies)

---

## System Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Stripe
- **Email**: Resend (via SMTP)
- **Hosting**: Vercel (likely)

### Project Structure
```
/client/           - React frontend application
/server/           - Express backend server
/shared/           - Shared TypeScript types/schemas
/migrations/       - Database migration scripts
/scripts/          - Utility SQL scripts
/docs/            - Documentation
```

---

## User System & Authentication

### Architecture Overview

```
┌─────────────────┐
│  auth.users     │  ← Supabase Auth (Primary source)
│  (Supabase)     │
└────────┬────────┘
         │
         │ Trigger: handle_new_user
         ↓
┌─────────────────┐
│ user_profiles   │  ← Application user data
│  (public)       │
└────────┬────────┘
         │
         │ FK references
         ↓
┌─────────────────┐
│ invoices        │  ← owner_id references user_profiles.id
│ service_requests│  ← user_id references user_profiles.id
│ aircraft        │  ← owner_id references user_profiles.id
│ memberships     │  ← owner_id references user_profiles.id
│ ... many more   │
└─────────────────┘
```

### User Creation Flow

1. **Supabase Dashboard** → Add user (sends invite email)
2. **Trigger `handle_new_user`** → Auto-creates row in `user_profiles`
3. **Default role** assigned via `assign_default_role` trigger
4. **User receives email** via Resend SMTP
5. **User clicks link** → Sets password → Account active

### User Roles

**Enum**: `user_role` (stored in `user_profiles.role`)

| Role      | Description                          | Access Level |
|-----------|--------------------------------------|--------------|
| `owner`   | Aircraft owner/client (default)      | Own data     |
| `cfi`     | Certified Flight Instructor          | Students     |
| `staff`   | Operations staff                     | Most data    |
| `ops`     | Operations manager                   | Most data    |
| `admin`   | System administrator                 | All data     |
| `founder` | Company founder (super admin)        | All + config |

**IMPORTANT**: 
- ✅ Single source of truth: `user_profiles.role` (user_role enum)
- ❌ OLD SYSTEM (being removed): `user_roles` table with `app_role` enum
- 🔧 Migration in progress: `migrations/resolve_user_roles_duplication.sql`

### User Deletion Problem

**Issue**: Cannot delete users if they have related records

**Error Example**:
```
Unable to delete row ... referenced by invoices
```

**Reason**: FK constraints without CASCADE:
- `invoices.owner_id` → `user_profiles.id`
- `service_requests.user_id` → `user_profiles.id`
- `aircraft.owner_id` → `user_profiles.id`
- Many more...

**Solutions**:
1. **Soft delete**: Add `deleted_at` column, filter in queries
2. **Reassign ownership**: Transfer records to another user
3. **Add CASCADE**: Modify FKs (⚠️ dangerous - will delete all user data)
4. **Archive system**: Move to `archived_users` table

**Current Recommendation**: Implement soft delete system

---

## Database Architecture

### Core Tables

| Table                  | Purpose                              | Key Relationships |
|------------------------|--------------------------------------|-------------------|
| `user_profiles`        | User accounts & roles                | FK from many tables |
| `aircraft`             | Aircraft inventory                   | → user_profiles (owner) |
| `memberships`          | User memberships                     | → user_profiles, aircraft |
| `service_requests`     | Service orders                       | → user_profiles, aircraft |
| `invoices`             | Billing                              | → user_profiles, aircraft |
| `maintenance`          | Aircraft maintenance                 | → aircraft |
| `flight_logs`          | Flight history                       | → aircraft, user_profiles |
| `cfi_schedule`         | Instructor scheduling                | → user_profiles (cfi) |

### Database Views

**IMPORTANT**: These views must be updated when changing underlying columns

1. **`v_owner_aircraft`** 
   - Depends on: `aircraft` table
   - ⚠️ Currently depends on `hobbs_time`, `tach_time` (being migrated to `hobbs_hours`, `tach_hours`)
   - Used by: Owner dashboard

2. **`v_memberships`**
   - Joins: `memberships` + `membership_tiers`
   - Adds: `tier_name`, `base_price`

3. **`v_service_requests`**
   - Joins: `service_requests` + `aircraft` + `user_profiles`
   - Adds: `tail_number`, `requester_name`

### Triggers & Functions

#### Critical Triggers

1. **`handle_new_user`** (ON auth.users INSERT)
   ```sql
   -- Creates user_profiles row automatically
   -- Syncs email from auth.users to user_profiles
   ```

2. **`assign_default_role`** (ON user_profiles INSERT)
   ```sql
   -- Assigns default role 'owner' if not specified
   ```

3. **`update_updated_at_column`** (BEFORE UPDATE on many tables)
   ```sql
   -- Automatically updates updated_at timestamp
   ```

4. **Email notification triggers**
   - `on_invoice_created` → sends email
   - `on_maintenance_due` → sends email

### Row Level Security (RLS)

**Status**: ✅ Enabled on all public tables

**Common Patterns**:

```sql
-- Owners can see their own data
CREATE POLICY "owners_own_data" ON table_name
  FOR SELECT USING (owner_id = auth.uid());

-- Staff can see all data
CREATE POLICY "staff_see_all" ON table_name
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'founder')
    )
  );
```

**Known Issues**:
- ⚠️ Recursive policy checks can cause infinite loops
- ⚠️ `user_profiles` RLS has been fixed multiple times
- ✅ Current state: Stable after `migrations/fix_user_creation_trigger.sql`

### Schema Sync Status

**Last Validated**: November 14, 2025

**Status**: ✅ TypeScript types synchronized with database schema

**Documents**:
- `SCHEMA_SYNC_ISSUES.md` - Detailed issue analysis
- `SCHEMA_SYNC_ACTION_PLAN.md` - Implementation guide
- `SCHEMA_ANALYSIS_SUMMARY.md` - Executive summary

**Key Findings**:
- ✅ All 45+ tables have TypeScript interfaces
- ⚠️ 2 duplicate columns in `aircraft` (migration pending)
- ⚠️ Dual user role system (migration pending)
- ✅ 6 missing table interfaces added
- ✅ 3 database views documented

---

## Known Issues & Constraints

### 1. Aircraft Column Migration

**Issue**: Duplicate columns `hobbs_time`/`tach_time` and `hobbs_hours`/`tach_hours`

**Blocker**: View `v_owner_aircraft` depends on old column names

**Solution**: `migrations/cleanup_aircraft_duplicate_columns.sql`
- Updates view first
- Drops old columns with CASCADE
- Recreates view with aliases for backward compatibility

**Status**: 🔧 Migration script ready, needs testing

### 2. User Role System Duplication

**Issue**: Two systems for storing user roles
- `user_profiles.role` (user_role enum) ✅ CORRECT
- `user_roles` table (app_role enum) ❌ DEPRECATED

**Solution**: `migrations/resolve_user_roles_duplication.sql`
- Migrates data from `user_roles` → `user_profiles.role`
- Drops `user_roles` table
- Removes `app_role` enum

**Status**: 🔧 Migration script ready, needs testing

### 3. User Deletion Constraints

**Issue**: Cannot delete users with related records

**Affected Tables**:
- `invoices` (owner_id)
- `service_requests` (user_id)
- `aircraft` (owner_id)
- `memberships` (owner_id)
- `flight_logs` (pilot_id)
- Many more...

**Recommended Solution**: Implement soft delete
```sql
-- Add to user_profiles
ALTER TABLE user_profiles ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN deleted_by UUID REFERENCES user_profiles(id);
```

**Status**: ⏳ Not yet implemented

### 4. Membership Tier Ambiguity

**Issue**: `memberships` table has both:
- `tier` (TEXT) - stores tier name?
- `tier_id` (UUID) - FK to `membership_tiers`

**Question**: Which is authoritative?

**Status**: ⚠️ Needs product owner clarification

---

## Recent Changes & Migrations

### Completed (Nov 14, 2025)

1. ✅ **Schema Analysis**
   - Exported full schema from Supabase (2,764 rows)
   - Identified 8 critical mismatches
   - Updated TypeScript types (200+ lines)

2. ✅ **TypeScript Type Updates**
   - `shared/database-types.ts` - Added 9 interfaces, updated 3
   - `shared/supabase-types.ts` - Updated Aircraft, ServiceRequest
   - All changes compile with no errors

3. ✅ **Documentation**
   - Created comprehensive schema sync documentation
   - Created migration scripts with detailed logging
   - Added database view interfaces

### Pending Migrations

1. 🔧 **`migrations/cleanup_aircraft_duplicate_columns.sql`**
   - **Purpose**: Remove duplicate hobbs_time/tach_time columns
   - **Risk**: Low (data is migrated first)
   - **Dependencies**: Updates `v_owner_aircraft` view
   - **Status**: Ready for staging testing

2. 🔧 **`migrations/resolve_user_roles_duplication.sql`**
   - **Purpose**: Consolidate user role system
   - **Risk**: Medium (affects authentication)
   - **Dependencies**: RLS policies reference user_profiles.role
   - **Status**: Ready for staging testing

### Migration Execution Order

**IMPORTANT**: Run in this order on staging first!

```bash
# 1. Test on staging database first
# 2. Backup production before running

# Step 1: Aircraft columns
psql -f migrations/cleanup_aircraft_duplicate_columns.sql

# Step 2: User roles
psql -f migrations/resolve_user_roles_duplication.sql

# Step 3: Verify
npm run build  # Check TypeScript compilation
npm test       # Run test suite
```

---

## Email & Communication

### SMTP Configuration

**Provider**: Resend  
**Status**: ✅ Fully functional

**Configuration** (in Supabase Dashboard → Authentication → Email Templates):
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [API key from Resend]
Sender email: info@freedomaviationco.com
Sender name: Freedom Aviation
```

### Email Behavior

**Envelope Sender**: `0100019a83ce3ede-...@send.freedomaviationco.com`
- This is **normal** - Resend uses SES-style message IDs
- Recipients see: `Freedom Aviation <info@freedomaviationco.com>`

**Email Types Sent**:
1. User invitation emails (working ✅)
2. Password reset emails
3. Email verification
4. Invoice notifications
5. Maintenance due notifications

**Logging**: All emails logged in Resend dashboard

**Testing**:
```bash
# Check if emails are sending
# 1. Add user in Supabase dashboard
# 2. Check Resend logs: https://resend.com/emails
# 3. Verify email received
```

---

## Development Workflow

### Adding New Users

**Via Supabase Dashboard** (Preferred):
1. Go to Authentication → Users
2. Click "Add user"
3. Enter email
4. Click "Send invite"
5. ✅ Trigger creates user_profiles automatically
6. ✅ Email sent via Resend

**Via SQL** (Advanced):
```sql
-- Only if you need to bypass email
INSERT INTO auth.users (email, encrypted_password, ...)
VALUES (...);
-- Trigger will create user_profiles
```

### Deleting Users

**⚠️ CAUTION**: Users with related records cannot be deleted

**Check dependencies first**:
```sql
-- Check if user has invoices
SELECT COUNT(*) FROM invoices WHERE owner_id = 'user-id';

-- Check if user has aircraft
SELECT COUNT(*) FROM aircraft WHERE owner_id = 'user-id';

-- Check if user has service requests
SELECT COUNT(*) FROM service_requests WHERE user_id = 'user-id';
```

**Safe deletion** (if no dependencies):
```sql
-- 1. Delete from user_profiles (will cascade to auth.users)
DELETE FROM user_profiles WHERE id = 'user-id';
```

**Recommended**: Implement soft delete instead

### Modifying Schema

**When changing table columns**:

1. ✅ Check for dependent views:
   ```sql
   SELECT 
     v.table_schema,
     v.table_name AS view_name,
     d.refobjid::regclass AS depends_on
   FROM pg_views v
   JOIN pg_depend d ON d.objid = v.table_name::regclass
   WHERE d.refobjid::regclass::text LIKE '%table_name%';
   ```

2. ✅ Check for dependent RLS policies:
   ```sql
   SELECT * FROM pg_policies 
   WHERE definition ILIKE '%column_name%';
   ```

3. ✅ Update TypeScript types in `shared/database-types.ts`

4. ✅ Run TypeScript compiler: `npm run build`

5. ✅ Create migration script with proper error handling

6. ✅ Test on staging first!

---

## Critical Dependencies

### Foreign Key Relationships

**Cannot delete without handling**:

```
auth.users (1) ─┐
                ↓
user_profiles (1) ─┬─→ invoices (N)
                   ├─→ service_requests (N)
                   ├─→ aircraft (N)
                   ├─→ memberships (N)
                   ├─→ flight_logs (N)
                   ├─→ cfi_schedule (N)
                   └─→ instruction_requests (N)

aircraft (1) ─┬─→ service_requests (N)
              ├─→ maintenance (N)
              ├─→ flight_logs (N)
              └─→ invoices (N)
```

### View Dependencies

**Must update views when changing**:

```
aircraft.hobbs_time  ← v_owner_aircraft (depends on this column)
aircraft.tach_time   ← v_owner_aircraft (depends on this column)
```

### Trigger Dependencies

**Auto-executed on table changes**:

```
auth.users INSERT     → handle_new_user → creates user_profiles
user_profiles INSERT  → assign_default_role → sets default role
ANY UPDATE           → update_updated_at_column → updates timestamp
invoices INSERT      → on_invoice_created → sends email
```

---

## Quick Reference Commands

### Database Queries

```sql
-- Check user role
SELECT id, email, role FROM user_profiles WHERE email = 'user@example.com';

-- Check aircraft status
SELECT tail_number, hobbs_hours, tach_hours, status FROM aircraft;

-- Check view definition
\d+ v_owner_aircraft

-- Check trigger definition
\sf handle_new_user

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Check FK constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'user_profiles';
```

### TypeScript

```bash
# Check compilation
npm run build

# Run tests
npm test

# Start dev server
npm run dev

# Type check only
npx tsc --noEmit
```

---

## Troubleshooting Guide

### Problem: User creation fails

**Check**:
1. Is SMTP configured correctly?
2. Is Resend API key valid?
3. Does `handle_new_user` trigger exist?
4. Are RLS policies blocking?

**Debug**:
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if user_profiles was created
SELECT * FROM user_profiles WHERE email = 'test@example.com';
```

### Problem: Cannot delete user

**Reason**: FK constraints

**Solution**:
```sql
-- Find what's blocking
SELECT 
  tc.table_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN (
  SELECT ccu.table_name
  FROM information_schema.constraint_column_usage ccu
  WHERE ccu.column_name = 'id'
  AND ccu.table_name = 'user_profiles'
);
```

### Problem: Migration fails with "depends on"

**Reason**: Views or constraints depend on column

**Solution**:
1. Update/drop dependent views first
2. Use `CASCADE` (⚠️ careful!)
3. Recreate views after column change

### Problem: TypeScript errors after schema change

**Reason**: Types out of sync with database

**Solution**:
1. Update `shared/database-types.ts`
2. Update `shared/supabase-types.ts`
3. Run `npm run build` to check
4. Search codebase for old column references

---

## For AI Assistants (Cursor, etc.)

### When Working With This Codebase

**Always**:
- ✅ Check `user_profiles.role` (not `user_roles` table)
- ✅ Be aware of FK constraints when deleting
- ✅ Update views when changing table columns
- ✅ Run migrations on staging first
- ✅ Update TypeScript types when changing schema
- ✅ Check for RLS policy impacts

**Never**:
- ❌ Drop columns without checking view dependencies
- ❌ Delete users without checking FK constraints
- ❌ Modify auth.users directly (use Supabase dashboard)
- ❌ Skip staging when testing migrations
- ❌ Use CASCADE without understanding impact
- ❌ Reference `user_roles` table (being deprecated)

### Key Files to Reference

- `shared/database-types.ts` - Complete TypeScript schema
- `SCHEMA_SYNC_ISSUES.md` - Known schema problems
- `SCHEMA_SYNC_ACTION_PLAN.md` - Migration guide
- `migrations/` - All migration scripts
- `supabase-schema.sql` - Base schema

### Recent Context (Nov 2025)

1. Completed full schema synchronization
2. Identified duplicate aircraft columns (pending migration)
3. Identified dual user role system (pending migration)
4. Email system working via Resend
5. User deletion blocked by FK constraints (needs soft delete)

---

## 📞 Getting Help

**Database Issues**: Check `SCHEMA_SYNC_ISSUES.md`  
**Migration Issues**: Check `SCHEMA_SYNC_ACTION_PLAN.md`  
**Type Errors**: Check `shared/database-types.ts`  
**Email Issues**: Check Resend dashboard  
**User Issues**: This document (User System section)  

**Last Verified**: November 14, 2025  
**Verified By**: AI Assistant + User Collaboration  
**Next Review**: After pending migrations complete  

---

**END OF CURSOR CONTEXT DOCUMENT**

This file should be referenced at the start of any significant code changes or debugging sessions.

