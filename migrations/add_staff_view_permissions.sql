-- Add policy for staff/founder/admin to view all user profiles
-- This allows the Clients page to work

-- Drop if exists (to avoid duplicate errors)
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;

-- Create policy allowing staff/founder/admin/ops/cfi to view all profiles
-- This is SAFE because we're checking the auth.uid()'s role directly via a function
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has a staff role
  -- This avoids circular RLS by using a security definer function
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff', 'cfi', 'ops', 'founder')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the policy using the function
CREATE POLICY "Staff can view all profiles" ON public.user_profiles
  FOR SELECT 
  USING (public.is_staff_user());

-- Verify policies
SELECT 
  'Policies Created' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

