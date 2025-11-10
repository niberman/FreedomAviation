-- Fix missing assigned_to column in service_requests table
-- Run this in Supabase SQL Editor to add the missing column

DO $$ 
BEGIN
    -- Add assigned_to column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.service_requests ADD COLUMN assigned_to UUID REFERENCES public.user_profiles(id);
        RAISE NOTICE 'Added assigned_to column to service_requests table';
    ELSE
        RAISE NOTICE 'assigned_to column already exists in service_requests table';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'notes') THEN
        ALTER TABLE public.service_requests ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to service_requests table';
    ELSE
        RAISE NOTICE 'notes column already exists in service_requests table';
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to ON public.service_requests(assigned_to);

-- Update RLS policies to handle assigned_to column
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Staff can view assigned requests" ON public.service_requests;
DROP POLICY IF EXISTS "Staff can update assigned requests" ON public.service_requests;

-- Staff can see requests assigned to them
CREATE POLICY "Staff can view assigned requests" ON public.service_requests
FOR SELECT USING (
    assigned_to = auth.uid() OR
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('admin', 'staff')
    )
);

-- Staff can update their assigned requests
CREATE POLICY "Staff can update assigned requests" ON public.service_requests
FOR UPDATE USING (
    assigned_to = auth.uid() OR
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('admin', 'staff')
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('admin', 'staff')
    )
);
