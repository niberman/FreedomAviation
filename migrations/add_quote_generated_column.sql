-- Add quote_generated column to onboarding_data table
-- This column tracks whether a quote has been generated during onboarding

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'onboarding_data' 
        AND column_name = 'quote_generated'
    ) THEN
        ALTER TABLE public.onboarding_data 
        ADD COLUMN quote_generated BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Added quote_generated column to onboarding_data';
    ELSE
        RAISE NOTICE 'quote_generated column already exists';
    END IF;
END $$;

