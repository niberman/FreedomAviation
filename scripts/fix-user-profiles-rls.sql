-- Freedom Aviation - Fix user_profiles RLS for Admin Access
-- This script ensures admins can view all user profiles
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Check current policies
-- ============================================================================

-- List all policies on user_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: Fix the admin view policy
-- ============================================================================

-- The current policy uses has_role(auth.uid(), 'admin'::app_role) which is incorrect
-- We need to check the role column in user_profiles table instead

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Create the correct policy that checks the role column in user_profiles
CREATE POLICY "Admins and staff can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    -- Allow if user is admin or staff (legacy CFI roles are also supported)
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND role::text IN ('admin', 'staff', 'cfi')
    )
  );

-- ============================================================================
-- STEP 3: Verify the policy works
-- ============================================================================

-- Test query (run as admin user to verify it works)
-- This should return all owner profiles
-- SELECT id, email, full_name, role 
-- FROM public.user_profiles 
-- WHERE role = 'owner'
-- ORDER BY created_at DESC;

-- ============================================================================
-- STEP 4: Alternative approach - Use a function to check role
-- ============================================================================

-- If the above doesn't work, we can create a helper function
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
      AND role::text IN ('admin', 'staff', 'cfi')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then use the function in the policy (alternative approach)
-- DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;
-- CREATE POLICY "Admins and staff can view all profiles" ON public.user_profiles
--   FOR SELECT USING (public.is_admin_or_staff());

-- ============================================================================
-- VERIFY: Check current user's role
-- ============================================================================

-- Run this to verify your current user's role
-- SELECT id, email, role 
-- FROM public.user_profiles 
-- WHERE id = auth.uid();

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If admins still can't see clients, check:
-- 1. Is the user's role set to 'admin' in user_profiles?
-- 2. Is RLS enabled on the table?
-- 3. Are there any conflicting policies?

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- Check all policies on user_profiles
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

