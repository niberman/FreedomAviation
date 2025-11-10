-- Create flight logs table for tracking flight operations
-- Run this in Supabase SQL Editor

-- Create flight_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.flight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
    pilot_id UUID REFERENCES public.user_profiles(id) NOT NULL,
    date DATE NOT NULL,
    departure_airport TEXT NOT NULL,
    arrival_airport TEXT NOT NULL,
    departure_time TIME,
    arrival_time TIME,
    flight_hours DECIMAL(10, 2) NOT NULL,
    hobbs_start DECIMAL(10, 2),
    hobbs_end DECIMAL(10, 2),
    tach_start DECIMAL(10, 2),
    tach_end DECIMAL(10, 2),
    fuel_added DECIMAL(10, 2),
    oil_added DECIMAL(10, 2),
    notes TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES public.user_profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flight_logs_aircraft_id ON public.flight_logs(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_flight_logs_pilot_id ON public.flight_logs(pilot_id);
CREATE INDEX IF NOT EXISTS idx_flight_logs_date ON public.flight_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_flight_logs_verified ON public.flight_logs(is_verified);

-- Enable RLS
ALTER TABLE public.flight_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Staff can view all flight logs" ON public.flight_logs;
DROP POLICY IF EXISTS "Pilots can view own flight logs" ON public.flight_logs;
DROP POLICY IF EXISTS "Owners can view aircraft flight logs" ON public.flight_logs;
DROP POLICY IF EXISTS "Authenticated users can create flight logs" ON public.flight_logs;
DROP POLICY IF EXISTS "Staff can update flight logs" ON public.flight_logs;
DROP POLICY IF EXISTS "Pilots can update own unverified logs" ON public.flight_logs;

-- Staff can view all flight logs
CREATE POLICY "Staff can view all flight logs" ON public.flight_logs
FOR SELECT USING (
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('admin', 'staff', 'cfi')
    )
);

-- Pilots can view their own flight logs
CREATE POLICY "Pilots can view own flight logs" ON public.flight_logs
FOR SELECT USING (
    pilot_id = auth.uid()
);

-- Aircraft owners can view logs for their aircraft
CREATE POLICY "Owners can view aircraft flight logs" ON public.flight_logs
FOR SELECT USING (
    aircraft_id IN (
        SELECT id FROM public.aircraft WHERE owner_id = auth.uid()
    )
);

-- Authenticated users can create flight logs
CREATE POLICY "Authenticated users can create flight logs" ON public.flight_logs
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    pilot_id = auth.uid()
);

-- Staff can update flight logs (for verification)
CREATE POLICY "Staff can update flight logs" ON public.flight_logs
FOR UPDATE USING (
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('admin', 'staff', 'cfi')
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('admin', 'staff', 'cfi')
    )
);

-- Pilots can update their own unverified logs
CREATE POLICY "Pilots can update own unverified logs" ON public.flight_logs
FOR UPDATE USING (
    pilot_id = auth.uid() AND
    is_verified = FALSE
)
WITH CHECK (
    pilot_id = auth.uid() AND
    is_verified = FALSE
);

-- Create function to auto-update hobbs hours on aircraft when flight log is created
CREATE OR REPLACE FUNCTION update_aircraft_hobbs_from_flight_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if hobbs_end is provided and greater than current hobbs_hours
    IF NEW.hobbs_end IS NOT NULL THEN
        UPDATE public.aircraft
        SET hobbs_hours = NEW.hobbs_end
        WHERE id = NEW.aircraft_id
        AND (hobbs_hours IS NULL OR hobbs_hours < NEW.hobbs_end);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating hobbs
DROP TRIGGER IF EXISTS update_hobbs_on_flight_log ON public.flight_logs;
CREATE TRIGGER update_hobbs_on_flight_log
AFTER INSERT OR UPDATE ON public.flight_logs
FOR EACH ROW
EXECUTE FUNCTION update_aircraft_hobbs_from_flight_log();

-- Completion notice
DO $$ 
BEGIN
    RAISE NOTICE 'Flight logs table and policies created successfully!';
END $$;
