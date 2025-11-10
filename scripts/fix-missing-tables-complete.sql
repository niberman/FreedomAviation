-- Complete setup for missing tables in Freedom Aviation Supabase database
-- Run this SQL script in your Supabase SQL Editor

-- ============================================
-- 1. CREATE ENUM TYPES (if they don't exist)
-- ============================================

DO $$ BEGIN
  CREATE TYPE service_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_class AS ENUM ('I', 'II', 'III');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('current', 'due_soon', 'overdue');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. CREATE SERVICE_REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
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

-- ============================================
-- 3. CREATE MEMBERSHIP_QUOTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.membership_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  package_id TEXT NOT NULL,
  tier_name TEXT,
  base_monthly NUMERIC(10, 2),
  hangar_id TEXT,
  hangar_cost NUMERIC(10, 2),
  total_monthly NUMERIC(10, 2),
  aircraft_tail TEXT,
  aircraft_make TEXT,
  aircraft_model TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. CREATE ONBOARDING_DATA TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) UNIQUE NOT NULL,
  step TEXT DEFAULT 'welcome',
  personal_info JSONB,
  aircraft_info JSONB,
  membership_selection JSONB,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================

-- Drop service_requests policies if they exist
DROP POLICY IF EXISTS "Users can view own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can create service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can update service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins can delete service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Staff can view service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Staff can update service requests" ON public.service_requests;

-- Drop membership_quotes policies if they exist
DROP POLICY IF EXISTS "Users can view own quotes" ON public.membership_quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON public.membership_quotes;
DROP POLICY IF EXISTS "Staff can view all quotes" ON public.membership_quotes;

-- Drop onboarding_data policies if they exist
DROP POLICY IF EXISTS "Users can view own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can insert own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can update own onboarding data" ON public.onboarding_data;

-- ============================================
-- 7. CREATE RLS POLICIES FOR SERVICE_REQUESTS
-- ============================================

-- Users can view their own service requests OR staff/admin can view all
CREATE POLICY "Users can view own service requests" ON public.service_requests
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'cfi'))
  );

-- Users can create their own service requests
CREATE POLICY "Users can create service requests" ON public.service_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Staff and admins can update service requests
CREATE POLICY "Staff can update service requests" ON public.service_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'cfi'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'cfi'))
  );

-- Only admins can delete service requests
CREATE POLICY "Admins can delete service requests" ON public.service_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 8. CREATE RLS POLICIES FOR MEMBERSHIP_QUOTES
-- ============================================

-- Users can view their own quotes
CREATE POLICY "Users can view own quotes" ON public.membership_quotes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own quotes
CREATE POLICY "Users can insert own quotes" ON public.membership_quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff can view all quotes
CREATE POLICY "Staff can view all quotes" ON public.membership_quotes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'cfi'))
  );

-- ============================================
-- 9. CREATE RLS POLICIES FOR ONBOARDING_DATA
-- ============================================

-- Users can view their own onboarding data
CREATE POLICY "Users can view own onboarding data" ON public.onboarding_data
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own onboarding data
CREATE POLICY "Users can insert own onboarding data" ON public.onboarding_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding data
CREATE POLICY "Users can update own onboarding data" ON public.onboarding_data
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Service requests indexes
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_aircraft_id ON public.service_requests(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to ON public.service_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_requests_status_created ON public.service_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_requested_departure ON public.service_requests(requested_departure);

-- Membership quotes indexes
CREATE INDEX IF NOT EXISTS idx_membership_quotes_user_id ON public.membership_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_quotes_status ON public.membership_quotes(status);
CREATE INDEX IF NOT EXISTS idx_membership_quotes_created_at ON public.membership_quotes(created_at DESC);

-- Onboarding data indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_data_user_id ON public.onboarding_data(user_id);

-- ============================================
-- 11. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for service_requests
DROP TRIGGER IF EXISTS update_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for membership_quotes
DROP TRIGGER IF EXISTS update_membership_quotes_updated_at ON public.membership_quotes;
CREATE TRIGGER update_membership_quotes_updated_at
  BEFORE UPDATE ON public.membership_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for onboarding_data
DROP TRIGGER IF EXISTS update_onboarding_data_updated_at ON public.onboarding_data;
CREATE TRIGGER update_onboarding_data_updated_at
  BEFORE UPDATE ON public.onboarding_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;

GRANT ALL ON public.membership_quotes TO authenticated;
GRANT ALL ON public.membership_quotes TO service_role;

GRANT ALL ON public.onboarding_data TO authenticated;
GRANT ALL ON public.onboarding_data TO service_role;

-- ============================================
-- 13. ADD STRIPE FIELDS TO USER_PROFILES (if needed)
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='stripe_customer_id') THEN
    ALTER TABLE public.user_profiles ADD COLUMN stripe_customer_id TEXT;
    RAISE NOTICE 'Added stripe_customer_id to user_profiles';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE public.user_profiles ADD COLUMN stripe_subscription_id TEXT;
    RAISE NOTICE 'Added stripe_subscription_id to user_profiles';
  END IF;
END $$;

-- Create index for Stripe customer ID lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON public.user_profiles(stripe_customer_id);

-- ============================================
-- DONE!
-- ============================================

SELECT 'Setup complete! Tables created successfully.' AS status;

-- Verify tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_requests') 
    THEN '✓ service_requests table exists'
    ELSE '✗ service_requests table missing'
  END AS service_requests_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_quotes') 
    THEN '✓ membership_quotes table exists'
    ELSE '✗ membership_quotes table missing'
  END AS membership_quotes_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_data') 
    THEN '✓ onboarding_data table exists'
    ELSE '✗ onboarding_data table missing'
  END AS onboarding_data_check;

