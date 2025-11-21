-- Complete setup for preview branch
-- This combines all necessary migrations in one file
-- Safe to run multiple times (idempotent)

BEGIN;

-- ============================================================================
-- PART 1: Create onboarding_data table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    step TEXT DEFAULT 'welcome',
    personal_info JSONB,
    aircraft_info JSONB,
    membership_selection JSONB,
    quote_generated BOOLEAN DEFAULT false,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT onboarding_data_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT onboarding_data_user_id_key 
        UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Create RLS policies for onboarding_data
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can insert their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can delete their own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Staff can view all onboarding data" ON public.onboarding_data;

-- Create policies
CREATE POLICY "Users can view their own onboarding data"
ON public.onboarding_data
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding data"
ON public.onboarding_data
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding data"
ON public.onboarding_data
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding data"
ON public.onboarding_data
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all onboarding data"
ON public.onboarding_data
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'founder')
  )
);

-- ============================================================================
-- PART 3: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_data TO authenticated;
GRANT SELECT ON public.onboarding_data TO anon;

COMMIT;

