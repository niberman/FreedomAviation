-- Migration to add missing tables and columns for admin dashboard
-- Run this in Supabase SQL Editor if you already have the base schema

-- Add make column to aircraft if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='aircraft' AND column_name='make'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN make TEXT;
  END IF;
END $$;

-- Add model column to aircraft if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='aircraft' AND column_name='model'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN model TEXT;
  END IF;
END $$;

-- Add year column to aircraft if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='aircraft' AND column_name='year'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN year INTEGER;
  END IF;
END $$;

-- Add class column to aircraft if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='aircraft' AND column_name='class'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN class TEXT;
  END IF;
END $$;

-- Add hobbs_hours column to aircraft if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='aircraft' AND column_name='hobbs_hours'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN hobbs_hours DECIMAL(10, 2);
  END IF;
END $$;

-- Add tach_hours column to aircraft if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='aircraft' AND column_name='tach_hours'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN tach_hours DECIMAL(10, 2);
  END IF;
END $$;

-- Add image_url column to aircraft if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='aircraft' AND column_name='image_url'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Add base_location column to aircraft if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='aircraft' AND column_name='base_location'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN base_location TEXT;
  END IF;
END $$;

-- Add requested_for column to service_requests if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='service_requests' AND column_name='requested_for'
  ) THEN
    ALTER TABLE public.service_requests ADD COLUMN requested_for TEXT;
  END IF;
END $$;

-- Create service_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.service_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
  type TEXT NOT NULL,
  status service_status DEFAULT 'pending',
  assigned_to UUID REFERENCES public.user_profiles(id),
  notes TEXT,
  photos TEXT[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create consumable_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.consumable_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
  kind TEXT NOT NULL,
  quantity DECIMAL(10, 2),
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.service_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_tasks
DROP POLICY IF EXISTS "Aircraft owners can view service tasks" ON public.service_tasks;
CREATE POLICY "Aircraft owners can view service tasks" ON public.service_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can insert service tasks" ON public.service_tasks;
CREATE POLICY "Admins can insert service tasks" ON public.service_tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can update service tasks" ON public.service_tasks;
CREATE POLICY "Admins can update service tasks" ON public.service_tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can delete service tasks" ON public.service_tasks;
CREATE POLICY "Admins can delete service tasks" ON public.service_tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for consumable_events
DROP POLICY IF EXISTS "Aircraft owners can view consumable events" ON public.consumable_events;
CREATE POLICY "Aircraft owners can view consumable events" ON public.consumable_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can insert consumable events" ON public.consumable_events;
CREATE POLICY "Admins can insert consumable events" ON public.consumable_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can update consumable events" ON public.consumable_events;
CREATE POLICY "Admins can update consumable events" ON public.consumable_events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

DROP POLICY IF EXISTS "Admins can delete consumable events" ON public.consumable_events;
CREATE POLICY "Admins can delete consumable events" ON public.consumable_events
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_service_tasks_aircraft ON public.service_tasks(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_service_tasks_status ON public.service_tasks(status);
CREATE INDEX IF NOT EXISTS idx_consumable_events_aircraft ON public.consumable_events(aircraft_id);

-- Create updated_at triggers for new tables
CREATE TRIGGER IF NOT EXISTS update_service_tasks_updated_at BEFORE UPDATE ON public.service_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_consumable_events_updated_at BEFORE UPDATE ON public.consumable_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix memberships table if using old schema
DO $$
BEGIN
  -- Rename user_id to owner_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='memberships' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.memberships RENAME COLUMN user_id TO owner_id;
  END IF;
  
  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='memberships' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.memberships ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Rename class to tier if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='memberships' AND column_name='class'
  ) THEN
    ALTER TABLE public.memberships RENAME COLUMN class TO tier;
  END IF;
END $$;

-- Add updated_at trigger for memberships
CREATE TRIGGER IF NOT EXISTS update_memberships_updated_at BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update index name
DROP INDEX IF EXISTS idx_memberships_user;
CREATE INDEX IF NOT EXISTS idx_memberships_owner ON public.memberships(owner_id);

