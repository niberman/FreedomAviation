# Database Migrations

This folder contains SQL migrations for the Freedom Aviation database.

## 🚨 Critical: User Roles Migration

If you're experiencing **400 errors** and **can't access the staff dashboard**, you need to run the user roles migration.

### Quick Start

**Run these files in order in your Supabase SQL Editor:**

1. **`add_user_roles.sql`** ← **START HERE!**
   - Adds the missing `role` column to `user_profiles`
   - Creates the `user_role` enum type
   - Sets your user to `founder` role
   - **Required** - fixes the 400 errors

2. **`verify_roles.sql`** ← Run this to check it worked
   - Verification script
   - Shows all users and their roles
   - Confirms migration was successful

3. **`fix_rls_policies.sql`** ← Only if still having issues
   - Optional - only run if you still have access issues
   - Updates Row Level Security policies for role support

### Files in This Folder

| File | Purpose | When to Use |
|------|---------|-------------|
| `add_user_roles.sql` | **Main migration** - adds role column | ✅ Run first |
| `verify_roles.sql` | Verification & diagnostics | ✅ Run after migration |
| `fix_rls_policies.sql` | Fix RLS policies | ⚠️ Only if needed |
| `README_USER_ROLES.md` | Detailed documentation | 📖 Reference |

### Step-by-Step Instructions

#### 1. Open Supabase SQL Editor

Navigate to: `https://app.supabase.com/project/wsepwuxkwjnsgmkddkjw/sql`

#### 2. Run the Main Migration

- Open `add_user_roles.sql`
- Copy all contents
- Paste into SQL Editor
- Click **Run**
- Wait for "Success" message

#### 3. Verify It Worked

- Open `verify_roles.sql`  
- Copy all contents
- Paste into SQL Editor
- Click **Run**
- Check the output - you should see:
  - ✅ user_role enum exists
  - ✅ role column exists
  - ✅ Your user has founder role
  - ✅ No NULL roles

#### 4. Test in Application

- Log out
- Clear browser cache (or use incognito)
- Log back in
- Navigate to `/staff/dashboard`
- 🎉 Success!

## What This Migration Does

### Before Migration

```sql
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  -- ❌ No role column!
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
```

**Result:** 400 errors when querying `user_profiles?select=role`

### After Migration

```sql
CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');

CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  role user_role DEFAULT 'owner', -- ✅ Role column added!
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
```

**Result:** ✅ Role queries work, staff dashboard accessible

## Available Roles

| Role | Access |
|------|--------|
| `owner` | Regular client - owner dashboard only |
| `cfi` | Flight instructor - can create instruction invoices |
| `staff` | Staff member - staff dashboard access |
| `ops` | Operations team - operations management |
| `admin` | Administrator - full admin access |
| `founder` | Founder - highest level access |

## Troubleshooting

### Still Getting 400 Errors?

1. Check if migration ran successfully:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'user_profiles' AND column_name = 'role';
   ```
   Should return: `role`

2. If nothing returned, the migration didn't run - try again

### Can't Access Staff Dashboard?

1. Check your role:
   ```sql
   SELECT email, role FROM user_profiles 
   WHERE email = 'noah@freedomaviationco.com';
   ```
   Should return: `founder`

2. If not `founder`, update it:
   ```sql
   UPDATE user_profiles SET role = 'founder' 
   WHERE email = 'noah@freedomaviationco.com';
   ```

3. Log out and back in

### RLS Policies Blocking Access?

Run `fix_rls_policies.sql` to update the policies

## Documentation

For more detailed information, see:
- **Quick reference:** `../QUICK_FIX_ROLES.md`
- **Complete guide:** `../ROLES_FIX_SUMMARY.md`  
- **Technical details:** `README_USER_ROLES.md`

## Creating New Migrations

When creating new migrations:

1. Name files with date prefix: `YYYYMMDD_description.sql`
2. Include rollback instructions in comments
3. Test on development database first
4. Document in this README

## Migration History

| Date | File | Description | Status |
|------|------|-------------|--------|
| 2024 | `add_user_roles.sql` | Add role column to user_profiles | ✅ Ready |
| 2024 | `fix_rls_policies.sql` | Update RLS policies for roles | ✅ Ready |

---

**Need help?** See the main documentation in `ROLES_FIX_SUMMARY.md`

