-- Add 'ops' and 'founder' roles to user_role enum
-- ops: operations staff who receive service request notifications
-- founder: super-admin with all permissions and customizable notifications

-- IMPORTANT: PostgreSQL doesn't allow adding enum values inside transactions
-- You must run these commands ONE AT A TIME in separate queries in Supabase SQL Editor
-- 
-- If you get an error about 'app_role', replace 'user_role' with 'app_role' below
--
-- Step 1: Run this command FIRST (copy and paste into Supabase SQL Editor):
-- ALTER TYPE user_role ADD VALUE 'ops';
--
-- Step 2: After Step 1 succeeds, run this command SECOND (separate query):
-- ALTER TYPE user_role ADD VALUE 'founder';
--
-- Then continue with the rest of this script

-- Check which enum name is actually used
DO $$
DECLARE
  enum_name TEXT;
BEGIN
  -- Try to find the enum type
  SELECT typname INTO enum_name
  FROM pg_type 
  WHERE typname IN ('user_role', 'app_role')
  LIMIT 1;
  
  IF enum_name IS NULL THEN
    RAISE EXCEPTION 'Could not find user_role or app_role enum type. Please check the enum name.';
  END IF;
  
  RAISE NOTICE 'Found enum type: %', enum_name;
  RAISE NOTICE 'Please run these commands manually:';
  RAISE NOTICE 'ALTER TYPE % ADD VALUE ''ops'';', enum_name;
  RAISE NOTICE 'ALTER TYPE % ADD VALUE ''founder'';', enum_name;
END $$;

-- Attempt to add 'ops' (will fail if already exists or in wrong transaction)
-- Comment out if you're running manually
-- ALTER TYPE user_role ADD VALUE 'ops';
-- ALTER TYPE user_role ADD VALUE 'founder';

-- Update any existing 'staff' users to be 'ops' if desired
-- (This is optional - comment out if you want to keep staff separate)
-- UPDATE public.user_profiles SET role = 'ops' WHERE role = 'staff';

-- Create notification preferences table for founders and other users
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) UNIQUE NOT NULL,
  receive_service_requests BOOLEAN DEFAULT true,
  receive_flight_instruction_requests BOOLEAN DEFAULT true,
  receive_maintenance_alerts BOOLEAN DEFAULT true,
  receive_emergency_requests BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view and update their own preferences
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Admins and founders can view all preferences
CREATE POLICY "Admins can view all notification preferences" ON public.notification_preferences
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'founder'))
  );

-- Create a function to get all ops users' emails (including founders who want service requests)
CREATE OR REPLACE FUNCTION get_ops_emails() 
RETURNS TABLE(email TEXT, full_name TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT u.email, u.full_name 
  FROM public.user_profiles u
  LEFT JOIN public.notification_preferences np ON u.id = np.user_id
  WHERE u.email IS NOT NULL
  AND (
    u.role = 'ops' 
    OR (u.role = 'founder' AND COALESCE(np.receive_service_requests, true) = true)
  );
$$;

-- Create a function to get all CFI emails (including founders who want instruction requests)
CREATE OR REPLACE FUNCTION get_cfi_emails() 
RETURNS TABLE(email TEXT, full_name TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT u.email, u.full_name 
  FROM public.user_profiles u
  LEFT JOIN public.notification_preferences np ON u.id = np.user_id
  WHERE u.email IS NOT NULL
  AND (
    u.role = 'cfi' 
    OR (u.role = 'founder' AND COALESCE(np.receive_flight_instruction_requests, true) = true)
  );
$$;

-- Update RLS policies to include ops and founder roles where staff has access
-- Service requests: ops and founders can view all
DROP POLICY IF EXISTS "Aircraft owners can view service requests" ON public.service_requests;
CREATE POLICY "Aircraft owners and ops can view service requests" ON public.service_requests
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  );

-- Service requests: ops and founders can update
DROP POLICY IF EXISTS "Admins can update service requests" ON public.service_requests;
CREATE POLICY "Admins and ops can update service requests" ON public.service_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  );

-- Service requests: ops and founders can insert
DROP POLICY IF EXISTS "Admins can insert service requests" ON public.service_requests;
CREATE POLICY "Admins and ops can insert service requests" ON public.service_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  );

-- Update other relevant policies
DROP POLICY IF EXISTS "Aircraft owners can view maintenance" ON public.maintenance;
CREATE POLICY "Aircraft owners and ops can view maintenance" ON public.maintenance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can insert maintenance" ON public.maintenance;
CREATE POLICY "Admins and ops can insert maintenance" ON public.maintenance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  );

DROP POLICY IF EXISTS "Admins can update maintenance" ON public.maintenance;
CREATE POLICY "Admins and ops can update maintenance" ON public.maintenance
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'ops', 'founder'))
  );

-- Allow ops and founders to view all aircraft
DROP POLICY IF EXISTS "Owners can view own aircraft" ON public.aircraft;
CREATE POLICY "Owners and ops can view aircraft" ON public.aircraft
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'ops', 'founder'))
  );

COMMENT ON COLUMN public.user_profiles.role IS 'User role: owner (aircraft owner), ops (operations staff), cfi (flight instructor), staff (general staff), admin (administrator), founder (super-admin with all permissions)';
