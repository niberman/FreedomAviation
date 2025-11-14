-- Create maintenance table
-- This table tracks maintenance items for aircraft

-- ============================================
-- STEP 1: Create maintenance table
-- ============================================

CREATE TABLE IF NOT EXISTS public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_hobbs DECIMAL(10, 2),
  due_tach DECIMAL(10, 2),
  status maintenance_status DEFAULT 'current',
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_maintenance_aircraft ON public.maintenance(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_due_date ON public.maintenance(due_date);

-- ============================================
-- STEP 3: Enable RLS
-- ============================================

ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS policies
-- ============================================

-- Aircraft owners can view maintenance for their aircraft
DROP POLICY IF EXISTS "Aircraft owners can view maintenance" ON public.maintenance;
CREATE POLICY "Aircraft owners can view maintenance" ON public.maintenance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid())
  );

-- Staff can view all maintenance
DROP POLICY IF EXISTS "Staff can view all maintenance" ON public.maintenance;
CREATE POLICY "Staff can view all maintenance" ON public.maintenance
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  );

-- Staff can insert maintenance
DROP POLICY IF EXISTS "Staff can insert maintenance" ON public.maintenance;
CREATE POLICY "Staff can insert maintenance" ON public.maintenance
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  );

-- Staff can update maintenance
DROP POLICY IF EXISTS "Staff can update maintenance" ON public.maintenance;
CREATE POLICY "Staff can update maintenance" ON public.maintenance
  FOR UPDATE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  )
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder')
  );

-- Admins can delete maintenance
DROP POLICY IF EXISTS "Admins can delete maintenance" ON public.maintenance;
CREATE POLICY "Admins can delete maintenance" ON public.maintenance
  FOR DELETE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'founder')
  );

-- ============================================
-- STEP 5: Create updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_maintenance_updated_at ON public.maintenance;
CREATE TRIGGER update_maintenance_updated_at 
  BEFORE UPDATE ON public.maintenance
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 6: Verify
-- ============================================

SELECT 
  '✅ Maintenance table created successfully!' as status,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'maintenance';

-- Show RLS policies
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'maintenance'
ORDER BY policyname;

-- ============================================
-- NOTE
-- ============================================
-- After running this, the maintenance queries will work (even if empty)
-- You can add maintenance items through the staff dashboard

