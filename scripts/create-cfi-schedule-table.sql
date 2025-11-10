-- Create CFI schedule table for managing instructor availability
-- Run this in Supabase SQL Editor

-- Create cfi_schedule table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cfi_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cfi_id UUID REFERENCES public.user_profiles(id) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
    owner_id UUID REFERENCES public.user_profiles(id),
    aircraft_id UUID REFERENCES public.aircraft(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure end time is after start time
    CONSTRAINT check_time_order CHECK (end_time > start_time),
    -- Ensure booked slots have owner
    CONSTRAINT check_booked_has_owner CHECK (
        (status != 'booked') OR (owner_id IS NOT NULL)
    )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cfi_schedule_cfi_id ON public.cfi_schedule(cfi_id);
CREATE INDEX IF NOT EXISTS idx_cfi_schedule_date ON public.cfi_schedule(date);
CREATE INDEX IF NOT EXISTS idx_cfi_schedule_status ON public.cfi_schedule(status);
CREATE INDEX IF NOT EXISTS idx_cfi_schedule_owner_id ON public.cfi_schedule(owner_id);

-- Enable RLS
ALTER TABLE public.cfi_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Public can view available slots" ON public.cfi_schedule;
DROP POLICY IF EXISTS "Authenticated users can view all slots" ON public.cfi_schedule;
DROP POLICY IF EXISTS "CFIs can create own schedule" ON public.cfi_schedule;
DROP POLICY IF EXISTS "CFIs can update own slots" ON public.cfi_schedule;
DROP POLICY IF EXISTS "CFIs can delete own unbooked slots" ON public.cfi_schedule;
DROP POLICY IF EXISTS "Owners can book available slots" ON public.cfi_schedule;

-- Everyone can view available slots
CREATE POLICY "Public can view available slots" ON public.cfi_schedule
FOR SELECT USING (
    status = 'available'
);

-- Authenticated users can view all slots
CREATE POLICY "Authenticated users can view all slots" ON public.cfi_schedule
FOR SELECT USING (
    auth.uid() IS NOT NULL
);

-- CFIs can create their own schedule slots
CREATE POLICY "CFIs can create own schedule" ON public.cfi_schedule
FOR INSERT WITH CHECK (
    auth.uid() = cfi_id AND
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('cfi', 'admin')
    )
);

-- CFIs can update their own slots
CREATE POLICY "CFIs can update own slots" ON public.cfi_schedule
FOR UPDATE USING (
    auth.uid() = cfi_id
)
WITH CHECK (
    auth.uid() = cfi_id
);

-- CFIs can delete their own slots (only if not booked)
CREATE POLICY "CFIs can delete own unbooked slots" ON public.cfi_schedule
FOR DELETE USING (
    auth.uid() = cfi_id AND
    status != 'booked'
);

-- Owners can book available slots
CREATE POLICY "Owners can book available slots" ON public.cfi_schedule
FOR UPDATE USING (
    status = 'available' AND
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role = 'owner'
    )
)
WITH CHECK (
    -- Ensure they're booking for themselves
    owner_id = auth.uid()
);

-- Create function to prevent double-booking
CREATE OR REPLACE FUNCTION check_cfi_schedule_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's an overlapping slot for the same CFI
    IF EXISTS (
        SELECT 1 FROM public.cfi_schedule
        WHERE cfi_id = NEW.cfi_id
        AND date = NEW.date
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
        AND (
            (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
            (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
            (NEW.start_time <= start_time AND NEW.end_time >= end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Schedule overlap detected for this CFI';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent overlapping schedules
DROP TRIGGER IF EXISTS prevent_cfi_schedule_overlap ON public.cfi_schedule;
CREATE TRIGGER prevent_cfi_schedule_overlap
BEFORE INSERT OR UPDATE ON public.cfi_schedule
FOR EACH ROW
EXECUTE FUNCTION check_cfi_schedule_overlap();

-- Completion notice
DO $$ 
BEGIN
    RAISE NOTICE 'CFI schedule table and policies created successfully!';
END $$;
