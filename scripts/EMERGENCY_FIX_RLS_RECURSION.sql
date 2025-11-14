-- EMERGENCY FIX: Infinite Recursion in user_profiles RLS
-- This fixes the "infinite recursion detected in policy" error
-- Run this immediately in your Supabase SQL Editor

-- Step 1: DROP ALL POLICIES (this stops the recursion)
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and CFIs can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles on signup" ON public.user_profiles;
DROP POLICY IF EXISTS "System can create profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- Step 2: Create SECURITY DEFINER function (bypasses RLS to avoid recursion)
DROP FUNCTION IF EXISTS public.get_current_user_role();

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Use SECURITY DEFINER to bypass RLS when checking role
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add comment
COMMENT ON FUNCTION public.get_current_user_role() IS 
  'Returns the role of the current user. Uses SECURITY DEFINER to avoid RLS recursion.';

-- Step 3: Create helper function for checking if user can view all profiles
DROP FUNCTION IF EXISTS public.can_view_all_profiles();

CREATE OR REPLACE FUNCTION public.can_view_all_profiles()
RETURNS BOOLEAN AS $$
BEGIN
  -- Use the SECURITY DEFINER function to avoid recursion
  RETURN get_current_user_role() IN ('admin', 'staff', 'founder', 'cfi');
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 4: Create simple policies that use the functions

-- SELECT: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- SELECT: Staff can view all profiles (uses function to avoid recursion)
CREATE POLICY "Staff can view all profiles" ON public.user_profiles
  FOR SELECT 
  USING (can_view_all_profiles());

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE 
  USING (get_current_user_role() IN ('admin', 'founder'))
  WITH CHECK (get_current_user_role() IN ('admin', 'founder'));

-- INSERT: System can create profiles during signup
CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id OR auth.uid() IS NULL
  );

-- DELETE: Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE 
  USING (get_current_user_role() IN ('admin', 'founder'));

-- Step 5: Verify policies were created
SELECT 
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'Yes' 
    ELSE 'No' 
  END as has_using_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- Step 6: Test the functions
SELECT 
  auth.uid() as current_user_id,
  get_current_user_role() as my_role,
  can_view_all_profiles() as can_view_all;

-- Step 7: Test querying user_profiles (should work now)
SELECT 
  id,
  email,
  role,
  'Successfully loaded!' as status
FROM public.user_profiles
WHERE role = 'owner'
LIMIT 5;

