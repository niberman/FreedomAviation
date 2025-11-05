-- Update Hangar Amenities to be Unified
-- This script updates both Sky Harbour and Freedom Aviation Hangar to have the same amenities

-- Update Sky Harbour amenities
UPDATE public.pricing_locations
SET features = jsonb_set(
  COALESCE(features, '{}'::jsonb),
  '{amenities}',
  '["Climate controlled", "24/7 access", "Secure facility", "Concierge service", "Aircraft detailing", "Direct ramp access", "Maintenance support", "Fuel discount"]'::jsonb
)
WHERE slug = 'sky-harbour';

-- Update Freedom Aviation Hangar amenities
UPDATE public.pricing_locations
SET features = jsonb_set(
  COALESCE(features, '{}'::jsonb),
  '{amenities}',
  '["Climate controlled", "24/7 access", "Secure facility", "Concierge service", "Aircraft detailing", "Direct ramp access", "Maintenance support", "Fuel discount"]'::jsonb
)
WHERE slug = 'freedom-aviation-hangar' OR slug = 'f9';

-- Verify the updates
SELECT 
  name,
  slug,
  features->'amenities' as amenities
FROM public.pricing_locations
WHERE slug IN ('sky-harbour', 'freedom-aviation-hangar', 'f9')
ORDER BY name;

