-- Fix table names to match what the app expects

-- Rename pricing_assumptions to settings_pricing_assumptions
ALTER TABLE IF EXISTS public.pricing_assumptions 
  RENAME TO settings_pricing_assumptions;

-- Rename pricing_overrides to aircraft_pricing_overrides  
ALTER TABLE IF EXISTS public.pricing_overrides 
  RENAME TO aircraft_pricing_overrides;

-- Update index names
DROP INDEX IF EXISTS idx_pricing_overrides_aircraft;
CREATE INDEX IF NOT EXISTS idx_aircraft_pricing_overrides_aircraft 
  ON public.aircraft_pricing_overrides(aircraft_id);
