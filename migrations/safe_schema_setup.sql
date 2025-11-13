-- Safe Schema Setup - Creates tables without recursive RLS policies
-- Run this in Supabase SQL Editor

-- Create enum types (skip if they exist)
DO $$ BEGIN
  CREATE TYPE membership_class AS ENUM ('I', 'II', 'III');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE service_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('current', 'due_soon', 'overdue');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create service_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id),
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  service_type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  description TEXT,
  airport TEXT,
  requested_departure TIMESTAMPTZ,
  requested_date DATE,
  requested_time TIME,
  requested_for TEXT,
  fuel_grade TEXT,
  fuel_quantity NUMERIC(10, 2),
  cabin_provisioning JSONB,
  o2_topoff BOOLEAN,
  tks_topoff BOOLEAN,
  gpu_required BOOLEAN,
  hangar_pullout BOOLEAN,
  status service_status DEFAULT 'pending',
  service_id UUID,
  is_extra_charge BOOLEAN DEFAULT FALSE,
  credits_used NUMERIC(10, 2) DEFAULT 0,
  assigned_to UUID REFERENCES public.user_profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on service_requests
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Safe RLS policies for service_requests (no circular references)
DROP POLICY IF EXISTS "Users can view own service requests" ON public.service_requests;
CREATE POLICY "Users can view own service requests" ON public.service_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own service requests" ON public.service_requests;
CREATE POLICY "Users can create own service requests" ON public.service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own service requests" ON public.service_requests;
CREATE POLICY "Users can update own service requests" ON public.service_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Note: Staff access to service_requests will be handled via the service role API
-- which bypasses RLS entirely (that's what the /api/service-requests endpoint does)

SELECT 'Safe schema setup complete!' as status;

