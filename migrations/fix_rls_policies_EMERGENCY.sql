-- EMERGENCY FIX: Remove infinite recursion from RLS policies
-- This must be run in Supabase SQL Editor immediately!

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles on signup" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;

-- Step 2: Create NON-RECURSIVE policies
-- These policies do NOT query user_profiles within their checks

-- 1. Everyone can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- 2. Users can update their own profile (but not role/staff fields)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Allow INSERT during signup (system automatically creates profile)
CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Step 3: Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify
SELECT 
  'RLS Policies Fixed' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- IMPORTANT: After running this
-- ============================================
-- 1. Clear your browser cache completely
-- 2. Or open an incognito/private window
-- 3. Log in again
-- 4. The infinite recursion will be gone
-- ============================================

