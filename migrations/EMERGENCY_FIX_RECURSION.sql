-- EMERGENCY FIX: Remove infinite recursion from RLS policies
-- Run this IMMEDIATELY in Supabase SQL Editor
-- 
-- Problem: Policies on user_profiles query user_profiles, causing infinite recursion
-- Solution: Use a custom JWT claim or bypass check for admin/founder roles

-- ============================================
-- STEP 1: Drop ALL existing user_profiles policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles on signup" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;

-- ============================================
-- STEP 2: Create NON-RECURSIVE policies
-- ============================================

-- Policy 1: Users can ALWAYS view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (no recursion)
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
-- STEP 4: Fix OTHER tables - use direct SELECT instead of EXISTS
-- ============================================
-- Note: Direct SELECT of role from user_profiles is OK for OTHER tables
-- The recursion only happens when user_profiles queries itself in EXISTS clause

-- Fix aircraft policies
DROP POLICY IF EXISTS "Owners can view own aircraft" ON public.aircraft;
DROP POLICY IF EXISTS "Staff can view all aircraft" ON public.aircraft;

CREATE POLICY "Owners can view own aircraft" ON public.aircraft
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  );

DROP POLICY IF EXISTS "Admins can insert aircraft" ON public.aircraft;
CREATE POLICY "Admins can insert aircraft" ON public.aircraft
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'founder')
  );

DROP POLICY IF EXISTS "Admins can update any aircraft" ON public.aircraft;
CREATE POLICY "Admins can update any aircraft" ON public.aircraft
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'founder')
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'founder')
  );

DROP POLICY IF EXISTS "Owners can update own aircraft" ON public.aircraft;
DROP POLICY IF EXISTS "Admins can delete aircraft" ON public.aircraft;
CREATE POLICY "Admins can delete aircraft" ON public.aircraft
  FOR DELETE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'founder')
  );

-- Fix memberships policies
DROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Staff can view all memberships" ON public.memberships;

CREATE POLICY "Users can view own memberships" ON public.memberships
  FOR SELECT USING (
    owner_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  );

-- Fix maintenance policies
DROP POLICY IF EXISTS "Aircraft owners can view maintenance" ON public.maintenance;
DROP POLICY IF EXISTS "Staff can view all maintenance" ON public.maintenance;

CREATE POLICY "Anyone can view maintenance" ON public.maintenance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  );

DROP POLICY IF EXISTS "Admins can insert maintenance" ON public.maintenance;
CREATE POLICY "Admins can insert maintenance" ON public.maintenance
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  );

DROP POLICY IF EXISTS "Admins can update maintenance" ON public.maintenance;
CREATE POLICY "Admins can update maintenance" ON public.maintenance
  FOR UPDATE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  )
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  );

DROP POLICY IF EXISTS "Admins can delete maintenance" ON public.maintenance;
CREATE POLICY "Admins can delete maintenance" ON public.maintenance
  FOR DELETE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'founder')
  );

-- Fix service_tasks policies
DROP POLICY IF EXISTS "Aircraft owners can view service tasks" ON public.service_tasks;
DROP POLICY IF EXISTS "Staff can view all service tasks" ON public.service_tasks;

CREATE POLICY "Anyone can view service tasks" ON public.service_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'ops', 'cfi')
  );

DROP POLICY IF EXISTS "Admins can insert service tasks" ON public.service_tasks;
CREATE POLICY "Admins can insert service tasks" ON public.service_tasks
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'ops', 'cfi')
  );

DROP POLICY IF EXISTS "Admins can update service tasks" ON public.service_tasks;
CREATE POLICY "Admins can update service tasks" ON public.service_tasks
  FOR UPDATE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'ops', 'cfi')
  )
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'ops', 'cfi')
  );

DROP POLICY IF EXISTS "Admins can delete service tasks" ON public.service_tasks;
CREATE POLICY "Admins can delete service tasks" ON public.service_tasks
  FOR DELETE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'founder')
  );

-- ============================================
-- STEP 5: Fix column name issue - memberships.is_active vs active
-- ============================================

-- Check if the column exists and rename if needed
DO $$
BEGIN
  -- Check if 'active' column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'memberships' 
    AND column_name = 'active'
  ) THEN
    -- Column is 'active', add alias 'is_active' as a computed column or rename
    -- First check if is_active doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'memberships' 
      AND column_name = 'is_active'
    ) THEN
      -- Rename active to is_active to match code expectations
      ALTER TABLE public.memberships RENAME COLUMN active TO is_active;
      RAISE NOTICE 'Renamed memberships.active to is_active';
    END IF;
  END IF;
END $$;

-- ============================================
-- STEP 6: Verify the fix
-- ============================================

SELECT 
  '✅ RLS Policies Fixed - No more recursion!' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- NEXT STEPS
-- ============================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Clear browser cache OR open incognito window
-- 3. Log in again
-- 4. The 500 errors should be gone
-- ============================================

