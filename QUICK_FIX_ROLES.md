# 🚨 QUICK FIX: Add Missing User Roles

## The Problem
Your database is missing the `role` column in `user_profiles`, causing 400 errors and preventing staff dashboard access.

## Quick Fix (5 minutes)

### 1. Open Supabase SQL Editor
Go to: https://app.supabase.com/project/wsepwuxkwjnsgmkddkjw/sql

### 2. Copy & Run This SQL

```sql
-- Create enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');
  END IF;
END $$;

-- Add role column
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
```

### 3. Log Out & Back In
- Clear cache or use incognito mode
- Log back in
- Navigate to `/staff/dashboard`
- ✅ You should have access!

## What Are The Roles?

| Role | Who Gets It |
|------|-------------|
| `owner` | Regular clients (default) |
| `cfi` | Flight instructors |
| `staff` | Staff members |
| `ops` | Operations team |
| `admin` | Administrators |
| `founder` | You (highest access) |

## Need More Details?
See `migrations/README_USER_ROLES.md` for full documentation.

