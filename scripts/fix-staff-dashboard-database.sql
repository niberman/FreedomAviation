-- Comprehensive fix for staff dashboard database issues
-- This script fixes all missing columns and schema mismatches

-- 1. Fix service_requests table missing columns
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
    
    -- Add requested_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'requested_date') THEN
        ALTER TABLE public.service_requests ADD COLUMN requested_date DATE;
        RAISE NOTICE 'Added requested_date column to service_requests table';
    ELSE
        RAISE NOTICE 'requested_date column already exists in service_requests table';
    END IF;
    
    -- Add requested_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'requested_time') THEN
        ALTER TABLE public.service_requests ADD COLUMN requested_time TIME;
        RAISE NOTICE 'Added requested_time column to service_requests table';
    ELSE
        RAISE NOTICE 'requested_time column already exists in service_requests table';
    END IF;
END $$;

-- 2. Fix aircraft table missing columns
DO $$ 
BEGIN
    -- Add make column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'make') THEN
        ALTER TABLE public.aircraft ADD COLUMN make TEXT;
        RAISE NOTICE 'Added make column to aircraft table';
    ELSE
        RAISE NOTICE 'make column already exists in aircraft table';
    END IF;
    
    -- Add model column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'model') THEN
        ALTER TABLE public.aircraft ADD COLUMN model TEXT;
        RAISE NOTICE 'Added model column to aircraft table';
    ELSE
        RAISE NOTICE 'model column already exists in aircraft table';
    END IF;
    
    -- Add class column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'class') THEN
        ALTER TABLE public.aircraft ADD COLUMN class TEXT;
        RAISE NOTICE 'Added class column to aircraft table';
    ELSE
        RAISE NOTICE 'class column already exists in aircraft table';
    END IF;
    
    -- Add hobbs_hours column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'hobbs_hours') THEN
        ALTER TABLE public.aircraft ADD COLUMN hobbs_hours DECIMAL(10, 2);
        RAISE NOTICE 'Added hobbs_hours column to aircraft table';
    ELSE
        RAISE NOTICE 'hobbs_hours column already exists in aircraft table';
    END IF;
END $$;

-- 3. Fix invoices table missing columns
DO $$ 
BEGIN
    -- Add stripe_checkout_session_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'stripe_checkout_session_id') THEN
        ALTER TABLE public.invoices ADD COLUMN stripe_checkout_session_id TEXT;
        RAISE NOTICE 'Added stripe_checkout_session_id column to invoices table';
    ELSE
        RAISE NOTICE 'stripe_checkout_session_id column already exists in invoices table';
    END IF;
    
    -- Add stripe_payment_intent_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'stripe_payment_intent_id') THEN
        ALTER TABLE public.invoices ADD COLUMN stripe_payment_intent_id TEXT;
        RAISE NOTICE 'Added stripe_payment_intent_id column to invoices table';
    ELSE
        RAISE NOTICE 'stripe_payment_intent_id column already exists in invoices table';
    END IF;
END $$;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to ON public.service_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_requests_status_created ON public.service_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_requested_departure ON public.service_requests(requested_departure);
CREATE INDEX IF NOT EXISTS idx_aircraft_owner_id ON public.aircraft(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_checkout ON public.invoices(stripe_checkout_session_id);

-- 5. Update or create RLS policies for assigned_to
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Staff can view assigned requests" ON public.service_requests;
DROP POLICY IF EXISTS "Staff can update assigned requests" ON public.service_requests;

-- Allow staff to see all service requests
CREATE POLICY "Staff can view service requests" ON public.service_requests
FOR SELECT USING (
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('admin', 'staff')
    )
);

-- Allow staff to update service requests
CREATE POLICY "Staff can update service requests" ON public.service_requests
FOR UPDATE USING (
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('admin', 'staff')
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('admin', 'staff')
    )
);

-- 6. Create or update the maintenance_due view
DROP VIEW IF EXISTS public.maintenance_due CASCADE;

CREATE VIEW public.maintenance_due AS
SELECT 
    m.id,
    m.aircraft_id,
    m.item_name as item,
    m.due_date as due_at_date,
    m.due_hobbs as due_at_hours,
    CASE
        WHEN m.due_date < CURRENT_DATE THEN 'high'
        WHEN m.due_date < CURRENT_DATE + interval '30 days' THEN 'medium'
        ELSE 'low'
    END as severity,
    CASE
        WHEN m.due_hobbs IS NOT NULL AND a.hobbs_hours IS NOT NULL 
        THEN m.due_hobbs - a.hobbs_hours
        ELSE NULL
    END as remaining_hours,
    CASE
        WHEN m.due_date IS NOT NULL 
        THEN m.due_date - CURRENT_DATE
        ELSE NULL
    END as remaining_days,
    a.tail_number
FROM public.maintenance m
LEFT JOIN public.aircraft a ON m.aircraft_id = a.id
WHERE m.status != 'completed';

-- Grant access to the view
GRANT SELECT ON public.maintenance_due TO authenticated;

-- Completion notice
DO $$ 
BEGIN
    RAISE NOTICE 'Staff dashboard database fixes completed successfully!';
END $$;
