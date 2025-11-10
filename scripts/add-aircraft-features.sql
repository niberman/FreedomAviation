-- Add TKS and Oxygen feature columns to aircraft table
-- This allows pricing configuration classes to differentiate by aircraft features

-- Add has_tks column to track if aircraft has TKS ice protection system
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' 
      AND table_name='aircraft' 
      AND column_name='has_tks'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN has_tks BOOLEAN DEFAULT false;
    COMMENT ON COLUMN public.aircraft.has_tks IS 'Whether the aircraft has TKS ice protection system';
  END IF;
END $$;

-- Add has_oxygen column to track if aircraft has oxygen system
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' 
      AND table_name='aircraft' 
      AND column_name='has_oxygen'
  ) THEN
    ALTER TABLE public.aircraft ADD COLUMN has_oxygen BOOLEAN DEFAULT false;
    COMMENT ON COLUMN public.aircraft.has_oxygen IS 'Whether the aircraft has oxygen system';
  END IF;
END $$;

-- Create index for feature-based queries
CREATE INDEX IF NOT EXISTS idx_aircraft_features ON public.aircraft(has_tks, has_oxygen);

