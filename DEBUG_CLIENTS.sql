-- Debug: Why are no clients showing?
-- Run these queries in Supabase SQL Editor to find the issue

-- ============================================
-- STEP 1: Check if any user_profiles exist
-- ============================================

SELECT 
  '=== ALL USER PROFILES ===' as section,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- STEP 2: Check if you can see them as founder
-- ============================================

-- First, get your user ID
SELECT 
  '=== YOUR USER ID ===' as section,
  auth.uid() as your_user_id,
  email
FROM public.user_profiles
WHERE id = auth.uid();

-- ============================================
-- STEP 3: Check RLS policies on user_profiles
-- ============================================

SELECT 
  '=== USER_PROFILES RLS POLICIES ===' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- STEP 4: Test the actual query that ClientsTable uses
-- ============================================

-- This is what the ClientsTable component queries:
SELECT 
  '=== CLIENTS QUERY (what ClientsTable runs) ===' as section,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.user_profiles
WHERE role = 'owner'
ORDER BY full_name ASC;

-- ============================================
-- STEP 5: Check if there are ANY owners
-- ============================================

SELECT 
  '=== COUNT BY ROLE ===' as section,
  role,
  COUNT(*) as count
FROM public.user_profiles
GROUP BY role
ORDER BY count DESC;

-- ============================================
-- STEP 6: If no owners exist, create a test client
-- ============================================

-- Uncomment and run this to create a test client:
/*
INSERT INTO public.user_profiles (id, email, full_name, role)
VALUES (
  gen_random_uuid(),
  'test-client@example.com',
  'Test Client',
  'owner'
)
RETURNING 
  '✅ Test client created!' as status,
  id,
  email,
  full_name,
  role;
*/

-- ============================================
-- STEP 7: Check if founder can see owner profiles
-- ============================================

-- Test if the RLS policy allows founder to see owners
SELECT 
  '=== TESTING RLS: Can founder see owners? ===' as section,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ YES - RLS allows viewing'
    ELSE '❌ NO - RLS is blocking (this is the problem!)'
  END as result,
  COUNT(*) as owners_visible
FROM public.user_profiles
WHERE role = 'owner';

-- ============================================
-- DIAGNOSIS
-- ============================================

-- If you see:
-- ✅ "owners_visible = 0" AND "COUNT BY ROLE shows owner = 0"
--    → No owners exist in database. Create test data.
--
-- ✅ "owners_visible = 0" BUT "COUNT BY ROLE shows owner > 0"  
--    → RLS is blocking! The policy doesn't allow founder to see owners.
--    → Need to add a policy for staff to view all user_profiles.
--
-- ✅ "owners_visible > 0"
--    → RLS works! Problem is in the client-side code.

-- ============================================
-- FIX: If RLS is blocking, run this
-- ============================================

-- Add policy for founder/staff to view ALL user_profiles
DROP POLICY IF EXISTS "Staff can view all user profiles" ON public.user_profiles;
CREATE POLICY "Staff can view all user profiles" ON public.user_profiles
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  );

-- Verify it worked
SELECT 
  '✅ Policy created! Test again:' as status,
  COUNT(*) as owners_now_visible
FROM public.user_profiles
WHERE role = 'owner';

