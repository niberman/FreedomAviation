# 🚨 FIX: Staff Role Access Issue

## The Problem

You're getting **400 errors** and **can't access `/staff/dashboard`** because:

❌ Your database is **missing the `role` column** in the `user_profiles` table

### Console Errors You're Seeing:
```
wsepwuxkwjnsgmkddkjw.supabase.co/rest/v1/user_profiles?select=role&id=eq...
Failed to load resource: the server responded with a status of 400 ()

Error fetching user profile in StaffProtectedRoute
Profile fetch error in StaffProtectedRoute
```

## The Solution (5 Minutes)

### 1️⃣ Open Supabase SQL Editor

Go to: https://app.supabase.com/project/wsepwuxkwjnsgmkddkjw/sql

### 2️⃣ Copy & Run This SQL

```sql
-- Create the role enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');
  END IF;
END $$;

-- Add the role column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN role user_role DEFAULT 'owner';
  END IF;
END $$;

-- Set existing users to owner
UPDATE public.user_profiles 
SET role = 'owner'
WHERE role IS NULL;

-- Give yourself founder access
UPDATE public.user_profiles 
SET role = 'founder'
WHERE email = 'noah@freedomaviationco.com';

-- Verify it worked
SELECT email, role FROM public.user_profiles WHERE email = 'noah@freedomaviationco.com';
```

Expected result:
```
email: noah@freedomaviationco.com
role: founder
```

### 3️⃣ Test Access

1. **Log out** of your application
2. **Clear browser cache** (or use incognito mode)
3. **Log back in**
4. Navigate to `/staff/dashboard`
5. ✅ **You should now have access!**

## What Are The Roles?

Your application supports **6 roles**:

| Role | Can Access Staff Dashboard? | Description |
|------|----------------------------|-------------|
| `owner` | ❌ No | Regular clients |
| `cfi` | ✅ Yes | Flight instructors |
| `staff` | ✅ Yes | Staff members |
| `ops` | ✅ Yes | Operations team |
| `admin` | ✅ Yes | Administrators |
| `founder` | ✅ Yes | You (highest access) |

## Why Did This Happen?

The original schema file (`supabase-schema.sql`) includes the `role` column, but your current database doesn't have it. This likely happened because:

1. The database was created from an incomplete schema, OR
2. This migration was never run, OR
3. The column was accidentally dropped

## Where Are The Migration Files?

All migration files are in the `migrations/` folder:

```
migrations/
├── README.md                  ← Start here
├── add_user_roles.sql        ← Main migration (run this!)
├── verify_roles.sql          ← Verification script
├── fix_rls_policies.sql      ← Only if still having issues
└── README_USER_ROLES.md      ← Full documentation
```

## Need More Help?

📖 See these files for detailed information:

- **Quick Fix:** `QUICK_FIX_ROLES.md` (2-minute read)
- **Complete Guide:** `ROLES_FIX_SUMMARY.md` (comprehensive)
- **Technical Details:** `migrations/README_USER_ROLES.md`

## Assign Roles to Other Users

After fixing your access, you can assign roles to other users:

```sql
-- Make someone a staff member
UPDATE public.user_profiles 
SET role = 'staff'
WHERE email = 'staff@example.com';

-- Make someone a CFI
UPDATE public.user_profiles 
SET role = 'cfi'
WHERE email = 'instructor@example.com';

-- Make someone an admin
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'admin@example.com';
```

## Still Having Issues?

Run the verification script to diagnose:

```sql
-- Check if everything is set up correctly
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
    THEN '✅' ELSE '❌' 
  END as enum_exists,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'role'
    )
    THEN '✅' ELSE '❌'
  END as column_exists,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE email = 'noah@freedomaviationco.com' AND role = 'founder'
    )
    THEN '✅' ELSE '❌'
  END as your_role_set;
```

All three should show ✅

---

**After running the migration, you'll have full access to:**
- ✅ Staff Dashboard (`/staff/dashboard`)
- ✅ Members Management (`/staff/members`)  
- ✅ Aircraft Management (`/staff/aircraft`)
- ✅ Operations (`/staff/operations`)
- ✅ Settings (`/staff/settings`)
- ✅ All administrative functions

🚀 **Let's get you back in!**

