-- Migration: Add user roles to user_profiles table
-- This adds the missing role column and enum type
-- Run this in Supabase SQL Editor

-- Step 1: Create the user_role enum type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');
  END IF;
END $$;

-- Step 2: Add the role column to user_profiles if it doesn't exist
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

-- Step 3: Set all existing users to 'owner' role by default (if they don't have a role)
UPDATE public.user_profiles 
SET role = 'owner'
WHERE role IS NULL;

-- Step 4: Set specific user(s) to staff/admin role
-- Update this with your email/user ID
UPDATE public.user_profiles 
SET role = 'founder'
WHERE email = 'noah@freedomaviationco.com';

-- Alternative: Update by user ID if you know it
-- UPDATE public.user_profiles 
-- SET role = 'founder'
-- WHERE id = '8d1ceb8e-8bb7-40c5-bd78-1e43633aa632';

-- Step 5: Verify the changes
SELECT id, email, full_name, role, created_at
FROM public.user_profiles
ORDER BY created_at DESC;

