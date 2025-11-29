-- FINAL FIX: User Profiles RLS Policies
-- This fixes the infinite recursion causing 500 errors on user_profiles queries
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop ALL existing user_profiles policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles on signup" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;

-- ============================================
-- STEP 2: Create SECURITY DEFINER function to check staff status
-- This function bypasses RLS, breaking the circular reference
-- ============================================
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff', 'cfi', 'ops', 'founder')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- STEP 3: Create non-recursive RLS policies
-- ============================================

-- 1. Users can view their own profile (simple id check - no recursion)
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- 2. Staff can view ALL profiles (uses SECURITY DEFINER function - no recursion)
CREATE POLICY "Staff can view all profiles" ON public.user_profiles
  FOR SELECT 
  USING (public.is_staff_user());

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Staff can update all profiles
CREATE POLICY "Staff can update all profiles" ON public.user_profiles
  FOR UPDATE 
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

-- 5. Allow INSERT during signup
CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 6. Staff can insert profiles (for creating new users)
CREATE POLICY "Staff can insert profiles" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (public.is_staff_user());

-- ============================================
-- STEP 4: Ensure RLS is enabled
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Grant execute on function
-- ============================================
GRANT EXECUTE ON FUNCTION public.is_staff_user TO authenticated;

-- ============================================
-- STEP 6: Verify the fix
-- ============================================
SELECT 
  'RLS Policies Fixed' as status,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- TEST: Try to fetch your own profile
-- If this works, the fix is successful
-- ============================================
-- SELECT * FROM user_profiles WHERE id = auth.uid();

