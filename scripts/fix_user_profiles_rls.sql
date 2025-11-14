-- Fix user_profiles RLS policies
-- The current policy references a non-existent function can_view_all_profiles()
-- This script creates the function and cleans up duplicate policies

-- Step 1: Create the missing function
CREATE OR REPLACE FUNCTION public.can_view_all_profiles()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user has admin, staff, founder, or cfi role
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff', 'founder', 'cfi')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add comment explaining the function
COMMENT ON FUNCTION public.can_view_all_profiles() IS 
  'Returns true if the current user has a role that can view all user profiles (admin, staff, founder, cfi)';

-- Step 2: Drop duplicate/old policies
DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles on signup" ON public.user_profiles;
DROP POLICY IF EXISTS "System can create profiles" ON public.user_profiles;

-- Step 3: Create clean, consolidated policies

-- SELECT policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins and CFIs can view all profiles" ON public.user_profiles
  FOR SELECT 
  USING (can_view_all_profiles());

-- UPDATE policies
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'founder')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'founder')
    )
  );

-- INSERT policies (for new user signup)
CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (
    -- Allow insert for new user's own profile
    auth.uid() = id 
    OR 
    -- Allow insert during signup when auth.uid() is not yet set
    auth.uid() IS NULL
  );

-- DELETE policies (admin only)
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'founder')
    )
  );

-- Step 4: Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- Step 5: Test the function
SELECT 
  auth.uid() as current_user_id,
  can_view_all_profiles() as can_view_all,
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) as current_role;

