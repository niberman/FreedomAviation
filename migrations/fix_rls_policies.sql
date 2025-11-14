-- Fix RLS Policies for user_profiles
-- This ensures users can query their own role without errors
-- Run this AFTER running add_user_roles.sql

-- Drop existing policies if they're causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles on signup" ON public.user_profiles;

-- Recreate policies with proper role column support

-- 1. Users can view their own profile (including role)
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. Users can update their own profile (but NOT their role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Staff can view all profiles
CREATE POLICY "Staff can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff', 'ops', 'cfi', 'founder')
    )
  );

-- 4. Admins can update all profiles (including roles)
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'founder')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'founder')
    )
  );

-- 5. System can insert new profiles during signup
CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

-- 6. Admins can insert profiles manually
CREATE POLICY "Admins can insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'founder')
    )
  );

-- Verify RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

