-- Create onboarding_data table if it doesn't exist
-- This migration is idempotent and safe to run multiple times

-- Create the table
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
    
    -- Add foreign key to auth.users
    CONSTRAINT onboarding_data_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    
    -- Ensure one record per user
    CONSTRAINT onboarding_data_user_id_key 
        UNIQUE (user_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.onboarding_data IS 'Stores user onboarding progress and collected information';
COMMENT ON COLUMN public.onboarding_data.step IS 'Current step in onboarding flow: welcome, personal-info, aircraft-info, membership, quote, complete';
COMMENT ON COLUMN public.onboarding_data.personal_info IS 'JSON object with full_name, phone, etc.';
COMMENT ON COLUMN public.onboarding_data.aircraft_info IS 'JSON object with tail_number, make, model, year, etc.';
COMMENT ON COLUMN public.onboarding_data.membership_selection IS 'JSON object with selected membership options';

-- Enable RLS
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_onboarding_data_updated_at'
    ) THEN
        CREATE TRIGGER update_onboarding_data_updated_at
            BEFORE UPDATE ON public.onboarding_data
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_data TO authenticated;
GRANT SELECT ON public.onboarding_data TO anon;

