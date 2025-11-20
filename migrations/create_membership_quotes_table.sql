-- Migration: Create membership_quotes table
-- Date: November 20, 2025
-- Purpose: Replace support_tickets usage for pricing quote requests

-- Create membership_quotes table
CREATE TABLE IF NOT EXISTS public.membership_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  tier_name TEXT,
  base_monthly NUMERIC,
  hangar_id TEXT,
  hangar_cost NUMERIC,
  total_monthly NUMERIC,
  aircraft_tail TEXT,
  aircraft_make TEXT,
  aircraft_model TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_membership_quotes_user_id 
  ON public.membership_quotes(user_id);

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_membership_quotes_status 
  ON public.membership_quotes(status);

-- Add index for created_at sorting
CREATE INDEX IF NOT EXISTS idx_membership_quotes_created_at 
  ON public.membership_quotes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.membership_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own quotes
CREATE POLICY "Users can view their own quotes"
  ON public.membership_quotes
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own quotes
CREATE POLICY "Users can create their own quotes"
  ON public.membership_quotes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own quotes
CREATE POLICY "Users can update their own quotes"
  ON public.membership_quotes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Staff can view all quotes
CREATE POLICY "Staff can view all quotes"
  ON public.membership_quotes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'founder', 'ops')
    )
  );

-- RLS Policy: Staff can update all quotes
CREATE POLICY "Staff can update all quotes"
  ON public.membership_quotes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'founder', 'ops')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'founder', 'ops')
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_membership_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_membership_quotes_updated_at
  BEFORE UPDATE ON public.membership_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_quotes_updated_at();

-- Add comment
COMMENT ON TABLE public.membership_quotes IS 'Stores pricing quote requests from potential and existing members';

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ membership_quotes table created successfully';
  RAISE NOTICE '✅ RLS policies created';
  RAISE NOTICE '✅ Indexes created';
  RAISE NOTICE '✅ Triggers created';
END $$;

