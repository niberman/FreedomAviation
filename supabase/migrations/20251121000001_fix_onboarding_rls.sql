-- Idempotent migration: Fix onboarding_data RLS policies
-- Safe to run multiple times - won't fail if policies already exist

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can insert their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can delete their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Staff can view all onboarding data" ON public.onboarding_data;

-- Allow users to view their own onboarding data
CREATE POLICY "Users can view their own onboarding data"
ON public.onboarding_data
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own onboarding data
CREATE POLICY "Users can insert their own onboarding data"
ON public.onboarding_data
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own onboarding data
CREATE POLICY "Users can update their own onboarding data"
ON public.onboarding_data
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own onboarding data
CREATE POLICY "Users can delete their own onboarding data"
ON public.onboarding_data
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow staff to view all onboarding data (using user_profiles.role, not user_roles table)
CREATE POLICY "Staff can view all onboarding data"
ON public.onboarding_data
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'founder')
  )
);

