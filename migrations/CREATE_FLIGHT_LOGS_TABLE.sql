-- Create flight_logs table
-- This table tracks flight logs for aircraft

-- ============================================
-- STEP 1: Create flight_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS public.flight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
  pilot_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  date DATE NOT NULL,
  departure_time TIME,
  arrival_time TIME,
  departure_airport TEXT,
  arrival_airport TEXT,
  flight_time_hours DECIMAL(10, 2),
  hobbs_start DECIMAL(10, 2),
  hobbs_end DECIMAL(10, 2),
  tach_start DECIMAL(10, 2),
  tach_end DECIMAL(10, 2),
  landings INTEGER DEFAULT 0,
  night_time DECIMAL(10, 2) DEFAULT 0,
  instrument_time DECIMAL(10, 2) DEFAULT 0,
  cross_country BOOLEAN DEFAULT false,
  remarks TEXT,
  verified_by UUID REFERENCES public.user_profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_flight_logs_aircraft ON public.flight_logs(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_flight_logs_pilot ON public.flight_logs(pilot_id);
CREATE INDEX IF NOT EXISTS idx_flight_logs_date ON public.flight_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_flight_logs_verifier ON public.flight_logs(verified_by);

-- ============================================
-- STEP 3: Enable RLS
-- ============================================

ALTER TABLE public.flight_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS policies
-- ============================================

-- Pilots can view their own flight logs
DROP POLICY IF EXISTS "Pilots can view own logs" ON public.flight_logs;
CREATE POLICY "Pilots can view own logs" ON public.flight_logs
  FOR SELECT USING (pilot_id = auth.uid());

-- Aircraft owners can view logs for their aircraft
DROP POLICY IF EXISTS "Owners can view aircraft logs" ON public.flight_logs;
CREATE POLICY "Owners can view aircraft logs" ON public.flight_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid())
  );

-- Staff can view all flight logs
DROP POLICY IF EXISTS "Staff can view all logs" ON public.flight_logs;
CREATE POLICY "Staff can view all logs" ON public.flight_logs
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'cfi')
  );

-- Pilots can insert their own flight logs
DROP POLICY IF EXISTS "Pilots can insert own logs" ON public.flight_logs;
CREATE POLICY "Pilots can insert own logs" ON public.flight_logs
  FOR INSERT WITH CHECK (pilot_id = auth.uid());

-- Staff can insert any flight logs
DROP POLICY IF EXISTS "Staff can insert any logs" ON public.flight_logs;
CREATE POLICY "Staff can insert any logs" ON public.flight_logs
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'cfi')
  );

-- Pilots can update their own unverified logs
DROP POLICY IF EXISTS "Pilots can update own unverified logs" ON public.flight_logs;
CREATE POLICY "Pilots can update own unverified logs" ON public.flight_logs
  FOR UPDATE USING (pilot_id = auth.uid() AND verified_by IS NULL)
  WITH CHECK (pilot_id = auth.uid());

-- Staff can update any flight logs
DROP POLICY IF EXISTS "Staff can update any logs" ON public.flight_logs;
CREATE POLICY "Staff can update any logs" ON public.flight_logs
  FOR UPDATE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'cfi')
  )
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'cfi')
  );

-- Only admins and founders can delete
DROP POLICY IF EXISTS "Admins can delete logs" ON public.flight_logs;
CREATE POLICY "Admins can delete logs" ON public.flight_logs
  FOR DELETE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'founder')
  );

-- ============================================
-- STEP 5: Create updated_at trigger
-- ============================================

DROP TRIGGER IF EXISTS update_flight_logs_updated_at ON public.flight_logs;
CREATE TRIGGER update_flight_logs_updated_at 
  BEFORE UPDATE ON public.flight_logs
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 6: Verify
-- ============================================

SELECT 
  '✅ Flight logs table created successfully!' as status,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'flight_logs';

-- Show RLS policies
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'flight_logs'
ORDER BY policyname;

-- ============================================
-- NOTE
-- ============================================
-- After running this, flight logs queries will work (even if empty)
-- Flight logs can be created through the staff dashboard

