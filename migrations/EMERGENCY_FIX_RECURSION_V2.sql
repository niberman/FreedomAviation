-- EMERGENCY FIX V2: Remove infinite recursion from RLS policies
-- Run this IMMEDIATELY in Supabase SQL Editor!
--
-- The previous fix broke when we added "Staff can view all user profiles"
-- because it queries user_profiles INSIDE the user_profiles policy = recursion!

-- ============================================
-- STEP 1: Drop ALL policies on user_profiles
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Staff can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles on signup" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;

-- ============================================
-- STEP 2: Create SIMPLE policies (NO SUBQUERIES!)
-- ============================================

-- Policy 1: Users can ALWAYS view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow INSERT during signup
CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 3: Re-enable RLS
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- IMPORTANT: How staff will access other profiles
-- ============================================
-- 
-- Staff CANNOT query user_profiles directly from the client
-- because RLS only allows viewing your own profile.
--
-- Instead, staff must use API endpoints that use service role:
-- - GET /api/clients (uses service role to bypass RLS)
-- - GET /api/users (uses service role to bypass RLS)
--
-- This is the CORRECT approach:
-- - Client-side queries respect RLS (only own profile)
-- - Server-side API uses service role (sees all profiles)

-- ============================================
-- STEP 4: Verify
-- ============================================

SELECT 
  '✅ RLS Policies Fixed - No more recursion!' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Should show ONLY 3 policies:
-- 1. Users can view own profile
-- 2. Users can update own profile
-- 3. System can insert profiles on signup

