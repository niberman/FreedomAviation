-- Fix schema issues: missing aircraft_documents table and flight_logs column mismatch

-- 1. Create aircraft_documents table if not exists
CREATE TABLE IF NOT EXISTS public.aircraft_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    expires_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES public.user_profiles(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.aircraft_documents ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS policies
-- Drop existing policies if they exist to avoid conflicts on re-run
DROP POLICY IF EXISTS "Owners can view aircraft documents" ON public.aircraft_documents;
CREATE POLICY "Owners can view aircraft documents" ON public.aircraft_documents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Staff can view all aircraft documents" ON public.aircraft_documents;
CREATE POLICY "Staff can view all aircraft documents" ON public.aircraft_documents
    FOR SELECT USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'cfi', 'ops')
    );

DROP POLICY IF EXISTS "Staff can manage aircraft documents" ON public.aircraft_documents;
CREATE POLICY "Staff can manage aircraft documents" ON public.aircraft_documents
    FOR ALL USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'cfi', 'ops')
    );

-- 4. Fix flight_logs column mismatch (rename flight_time_hours -> flight_hours)
-- Only run if the column exists with the old name
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_logs' AND column_name = 'flight_time_hours') THEN
        ALTER TABLE public.flight_logs RENAME COLUMN flight_time_hours TO flight_hours;
    END IF;
END $$;

-- 5. Ensure aircraft-documents storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('aircraft-documents', 'aircraft-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies
-- Allow authenticated users to access objects in this bucket
DROP POLICY IF EXISTS "Allow authenticated users to access aircraft-documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to access aircraft-documents" ON storage.objects
    FOR ALL USING (
        bucket_id = 'aircraft-documents' 
        AND auth.role() = 'authenticated'
    );


