-- Simple fix for user_profiles RLS policies
-- This version doesn't use a function, just inline checks
-- Run this if you prefer a simpler approach

-- Step 1: Drop all existing policies
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

-- Step 2: Create clean, simple policies

-- SELECT: Users can view own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- SELECT: Admins, staff, founders, and CFIs can view all profiles
CREATE POLICY "Staff can view all profiles" ON public.user_profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff', 'founder', 'cfi')
    )
  );

-- UPDATE: Users can update own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: Admins and founders can update all profiles
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

-- INSERT: System can insert profiles during signup
CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (
    -- Allow insert for new user's own profile
    auth.uid() = id 
    OR 
    -- Allow insert during signup when auth.uid() is not yet set
    auth.uid() IS NULL
  );

-- DELETE: Admins and founders can delete profiles
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

-- Step 3: Verify the policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Yes' 
    ELSE 'No' 
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Yes' 
    ELSE 'No' 
  END as has_with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- Step 4: Test query that staff dashboard uses
-- This should return all owners if you're logged in as admin/staff/founder/cfi
SELECT 
  id,
  full_name,
  email,
  role,
  'Current user can see this' as visibility
FROM public.user_profiles
WHERE role = 'owner'
ORDER BY full_name;

-- Step 5: Show your current user info
SELECT 
  id,
  email,
  full_name,
  role,
  CASE 
    WHEN role IN ('admin', 'staff', 'founder', 'cfi') THEN 'YES - Can view all profiles'
    ELSE 'NO - Can only view own profile'
  END as can_view_all_profiles
FROM public.user_profiles
WHERE id = auth.uid();

