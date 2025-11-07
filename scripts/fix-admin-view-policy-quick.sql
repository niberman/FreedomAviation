-- Freedom Aviation - Quick Fix for Admin View Policy
-- The current policy uses has_role() with app_role, but we need to check the role column
-- Run this in Supabase SQL Editor

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Create the correct policy that checks the role column in user_profiles
CREATE POLICY "Admins and CFIs can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    -- Check if the current user's role is admin or cfi in the user_profiles table
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'cfi')
    )
  );

-- Verify the policy was created
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'user_profiles'
  AND policyname = 'Admins and CFIs can view all profiles';


