-- Fix missing columns in database tables
-- Run this in Supabase SQL Editor to add any missing columns

-- Add missing columns to invoices table if they don't exist
DO $$ 
BEGIN
    -- Add category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'category') THEN
        ALTER TABLE public.invoices ADD COLUMN category TEXT DEFAULT 'service';
    END IF;
    
    -- Add created_by_cfi_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'created_by_cfi_id') THEN
        ALTER TABLE public.invoices ADD COLUMN created_by_cfi_id UUID REFERENCES public.user_profiles(id);
    END IF;
    
    -- Add invoice_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number') THEN
        ALTER TABLE public.invoices ADD COLUMN invoice_number TEXT;
    END IF;
    
    -- Add aircraft_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'aircraft_id') THEN
        ALTER TABLE public.invoices ADD COLUMN aircraft_id UUID REFERENCES public.aircraft(id);
    END IF;
    
    -- Add owner_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'owner_id') THEN
        ALTER TABLE public.invoices ADD COLUMN owner_id UUID REFERENCES public.user_profiles(id);
    END IF;
END $$;

-- Create invoice_lines table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_cents INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on invoice_lines
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON public.invoice_lines(invoice_id);

-- Add missing columns to service_requests table
DO $$ 
BEGIN
    -- Add requested_departure column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'requested_departure') THEN
        ALTER TABLE public.service_requests ADD COLUMN requested_departure TIMESTAMPTZ;
    END IF;
END $$;

-- Add missing columns to maintenance_due view/table
DO $$ 
BEGIN
    -- Check if maintenance_due is a view or table
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'maintenance_due') THEN
        -- It's a view, drop and recreate
        DROP VIEW IF EXISTS public.maintenance_due;
        
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
    END IF;
END $$;

-- Create stored procedures for invoice creation
CREATE OR REPLACE FUNCTION create_instruction_invoice(
    p_owner_id UUID,
    p_aircraft_id UUID,
    p_description TEXT,
    p_hours DECIMAL,
    p_rate_cents INTEGER,
    p_cfi_id UUID
) RETURNS UUID AS $$
DECLARE
    v_invoice_id UUID;
    v_invoice_number TEXT;
BEGIN
    -- Generate invoice number
    v_invoice_number := 'INV-' || to_char(CURRENT_DATE, 'YYYY-MM-DD-') || substr(gen_random_uuid()::text, 1, 8);
    
    -- Create invoice
    INSERT INTO public.invoices (
        owner_id,
        aircraft_id,
        category,
        status,
        amount,
        invoice_number,
        created_by_cfi_id,
        due_date
    ) VALUES (
        p_owner_id,
        p_aircraft_id,
        'instruction',
        'draft',
        (p_hours * p_rate_cents)::DECIMAL / 100,
        v_invoice_number,
        p_cfi_id,
        CURRENT_DATE + interval '30 days'
    ) RETURNING id INTO v_invoice_id;
    
    -- Create invoice line
    INSERT INTO public.invoice_lines (
        invoice_id,
        description,
        quantity,
        unit_cents,
        amount_cents
    ) VALUES (
        v_invoice_id,
        p_description,
        p_hours,
        p_rate_cents,
        (p_hours * p_rate_cents)::INTEGER
    );
    
    RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create finalize invoice function
CREATE OR REPLACE FUNCTION finalize_invoice(p_invoice_id UUID) RETURNS VOID AS $$
BEGIN
    UPDATE public.invoices
    SET status = 'finalized'
    WHERE id = p_invoice_id
    AND status = 'draft';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS policies include new columns
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own invoice lines
CREATE POLICY "Users can view their own invoice lines" ON public.invoice_lines
FOR SELECT USING (
    invoice_id IN (
        SELECT id FROM public.invoices WHERE owner_id = auth.uid()
    )
);

-- Allow staff/admin to view all invoice lines
CREATE POLICY "Staff can view all invoice lines" ON public.invoice_lines
FOR SELECT USING (
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('staff', 'admin', 'cfi')
    )
);

-- Allow staff/admin to create invoice lines
CREATE POLICY "Staff can create invoice lines" ON public.invoice_lines
FOR INSERT WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE role IN ('staff', 'admin', 'cfi')
    )
);

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_requests_aircraft_id ON public.service_requests(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_invoices_owner_id ON public.invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_aircraft_id ON public.invoices(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_invoices_category ON public.invoices(category);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by_cfi_id ON public.invoices(created_by_cfi_id);
