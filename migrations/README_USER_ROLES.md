# User Roles Migration - Fix for Staff Dashboard Access

## Problem Summary

Your database was missing the `role` column in the `user_profiles` table, causing:
- 400 errors when querying `user_profiles?select=role`
- Inability to access staff dashboard
- StaffProtectedRoute failing to verify user permissions

## Root Cause

The original schema file (`supabase-schema.sql`) includes user roles, but the current database doesn't have:
1. The `user_role` enum type
2. The `role` column in `user_profiles`

This likely happened because the database was created from a different schema or the migration wasn't run.

## Available Roles

The system supports 6 user roles (in order of privilege):

| Role | Description | Access Level |
|------|-------------|--------------|
| `owner` | Regular users/clients | Owner dashboard, own data |
| `cfi` | Certified Flight Instructor | Can create instruction invoices |
| `staff` | Staff member | Staff dashboard, view/edit service requests |
| `ops` | Operations staff | Operations management |
| `admin` | Administrator | Full administrative access |
| `founder` | Founder | Highest level access |

## Fix Instructions

### Step 1: Run the Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `migrations/add_user_roles.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run**

### Step 2: Verify the Migration

After running the migration, you should see:
- ✅ `user_role` enum type created
- ✅ `role` column added to `user_profiles`
- ✅ Your user (noah@freedomaviationco.com) set to `founder` role
- ✅ All other users defaulted to `owner` role

### Step 3: Test Access

1. Log out of the application
2. Clear your browser cache (or use incognito mode)
3. Log back in with noah@freedomaviationco.com
4. Navigate to `/staff/dashboard`
5. You should now have access!

## How Roles Are Checked

The application checks roles in several places:

### Frontend Protection
- `StaffProtectedRoute` component checks if user has a staff role
- Staff roles include: `staff`, `cfi`, `ops`, `admin`, `founder`
- Located in: `client/src/components/staff-protected-route.tsx`

### Backend Authorization
- Row Level Security (RLS) policies use roles to control data access
- Example: Only users with `admin` or `staff` roles can view all service requests
- Located in: RLS policies in database

### Role Checking Functions
Located in `client/src/lib/roles.ts`:
- `isStaffRole(role)` - Returns true for any staff-level role
- `isAdminRole(role)` - Returns true for admin or founder
- `isCfiRole(role)` - Returns true for cfi, admin, or founder
- `isOpsRole(role)` - Returns true for ops, admin, or founder

## Manual Role Assignment

To assign roles to other users:

```sql
-- Set a user to staff
UPDATE public.user_profiles 
SET role = 'staff'
WHERE email = 'staff@example.com';

-- Set a user to CFI
UPDATE public.user_profiles 
SET role = 'cfi'
WHERE email = 'instructor@example.com';

-- Set a user to admin
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'admin@example.com';
```

## New User Default

All new users are automatically assigned the `owner` role when they sign up.
This is handled by the `handle_new_user()` trigger function.

## Troubleshooting

### Still Getting 400 Errors?
1. Check if the migration ran successfully
2. Verify the `role` column exists:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'user_profiles' AND column_name = 'role';
   ```

### Role Not Showing Up?
1. Check your user's role:
   ```sql
   SELECT email, role FROM public.user_profiles WHERE email = 'noah@freedomaviationco.com';
   ```
2. Try logging out and back in to refresh the session

### Still Can't Access Staff Dashboard?
1. Clear browser cache and cookies
2. Check browser console for errors
3. Verify RLS policies are not blocking access
4. In dev mode, the StaffProtectedRoute should allow access by default

## Related Files

- Schema: `supabase-schema.sql`
- Migration: `migrations/add_user_roles.sql`
- Role Types: `client/src/lib/types/database.ts`
- Role Utilities: `client/src/lib/roles.ts`
- Staff Protection: `client/src/components/staff-protected-route.tsx`
- Protected Route: `client/src/components/protected-route.tsx`

## Questions?

If you continue to have issues after running this migration, check:
1. Supabase logs for any errors
2. Browser console for detailed error messages
3. Network tab to see the actual API responses
4. RLS policies to ensure they're not blocking access

