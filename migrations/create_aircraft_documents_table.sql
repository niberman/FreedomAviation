-- Create aircraft_documents table
-- This table tracks documents associated with aircraft

CREATE TABLE IF NOT EXISTS public.aircraft_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id), -- Optional: who uploaded it
  document_type TEXT NOT NULL, -- e.g., 'registration', 'airworthiness', 'weight_balance'
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  expires_at TIMESTAMPTZ,
  is_required BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_aircraft_documents_aircraft ON public.aircraft_documents(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_aircraft_documents_type ON public.aircraft_documents(document_type);

-- Enable RLS
ALTER TABLE public.aircraft_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Owners can view documents for their aircraft
DROP POLICY IF EXISTS "Owners can view aircraft documents" ON public.aircraft_documents;
CREATE POLICY "Owners can view aircraft documents" ON public.aircraft_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid())
  );

-- Staff can view all documents
DROP POLICY IF EXISTS "Staff can view all documents" ON public.aircraft_documents;
CREATE POLICY "Staff can view all documents" ON public.aircraft_documents
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'cfi', 'ops')
  );

-- Staff can insert/update/delete documents
DROP POLICY IF EXISTS "Staff can manage documents" ON public.aircraft_documents;
CREATE POLICY "Staff can manage documents" ON public.aircraft_documents
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'founder', 'cfi', 'ops')
  );

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_aircraft_documents_updated_at ON public.aircraft_documents;
CREATE TRIGGER update_aircraft_documents_updated_at 
  BEFORE UPDATE ON public.aircraft_documents
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

