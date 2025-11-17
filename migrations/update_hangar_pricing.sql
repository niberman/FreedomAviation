-- ============================================
-- Update Hangar Pricing
-- ============================================
-- Sky Harbour: $2000/month (premium upgrade)
-- Freedom Aviation Hangar: $0/month (included in base price)

BEGIN;

-- First, show current pricing
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'CURRENT Hangar Pricing:';
  RAISE NOTICE '====================================';
  
  FOR rec IN 
    SELECT name, slug, hangar_cost_monthly 
    FROM pricing_locations 
    WHERE active = true
    ORDER BY name
  LOOP
    RAISE NOTICE '  %: $%/month', rec.name, rec.hangar_cost_monthly;
  END LOOP;
  
  RAISE NOTICE '====================================';
END $$;

-- Update Sky Harbour to $2000/month (premium hangar upgrade)
UPDATE pricing_locations
SET 
  hangar_cost_monthly = 2000,
  updated_at = NOW()
WHERE slug = 'sky-harbour';

-- Update Freedom Aviation Hangar to $0 (included in base price)
UPDATE pricing_locations
SET 
  hangar_cost_monthly = 0,
  updated_at = NOW()
WHERE slug IN ('freedom-aviation-hangar', 'f9');

-- Show NEW pricing after update
DO $$
DECLARE
  rec RECORD;
  sky_harbour_cost NUMERIC;
  fa_hangar_cost NUMERIC;
  sky_harbour_found BOOLEAN := false;
  fa_hangar_found BOOLEAN := false;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'UPDATED Hangar Pricing:';
  RAISE NOTICE '====================================';
  
  FOR rec IN 
    SELECT name, slug, hangar_cost_monthly 
    FROM pricing_locations 
    WHERE active = true
    ORDER BY name
  LOOP
    IF rec.slug = 'sky-harbour' THEN
      RAISE NOTICE '  ✅ %: $%/month (Premium upgrade)', rec.name, rec.hangar_cost_monthly;
      sky_harbour_cost := rec.hangar_cost_monthly;
      sky_harbour_found := true;
    ELSIF rec.slug IN ('freedom-aviation-hangar', 'f9') THEN
      RAISE NOTICE '  ✅ %: $%/month (Included in base price)', rec.name, rec.hangar_cost_monthly;
      fa_hangar_cost := rec.hangar_cost_monthly;
      fa_hangar_found := true;
    ELSE
      RAISE NOTICE '  ℹ️  %: $%/month', rec.name, rec.hangar_cost_monthly;
    END IF;
  END LOOP;
  
  RAISE NOTICE '====================================';
  
  -- Verify Sky Harbour
  IF NOT sky_harbour_found THEN
    RAISE WARNING '⚠️  Sky Harbour location not found in pricing_locations table!';
  ELSIF sky_harbour_cost != 2000 THEN
    RAISE EXCEPTION 'Sky Harbour pricing update failed! Expected $2000, got $%', sky_harbour_cost;
  ELSE
    RAISE NOTICE '✅ Sky Harbour: $2000/month (premium upgrade)';
  END IF;
  
  -- Verify FA Hangar
  IF NOT fa_hangar_found THEN
    RAISE WARNING '⚠️  Freedom Aviation Hangar location not found!';
  ELSIF fa_hangar_cost != 0 THEN
    RAISE EXCEPTION 'FA Hangar pricing update failed! Expected $0, got $%', fa_hangar_cost;
  ELSE
    RAISE NOTICE '✅ Freedom Aviation Hangar: $0/month (included in base)';
  END IF;
  
  IF NOT sky_harbour_found OR NOT fa_hangar_found THEN
    RAISE NOTICE 'Available slugs:';
    FOR rec IN SELECT slug FROM pricing_locations WHERE active = true LOOP
      RAISE NOTICE '  - %', rec.slug;
    END LOOP;
  END IF;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after the migration to verify:
-- 
-- SELECT 
--   name,
--   slug,
--   hangar_cost_monthly,
--   active,
--   updated_at
-- FROM pricing_locations
-- WHERE active = true
-- ORDER BY hangar_cost_monthly;
--
-- Expected result:
-- - Freedom Aviation Hangar: $0/month (included in base price)
-- - Sky Harbour: $2000/month (premium upgrade)

