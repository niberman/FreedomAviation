-- Update pricing classes to differentiate by aircraft features
-- Class I: Aircraft with only oil (no TKS, no oxygen)
-- Class II: Aircraft with TKS and/or oxygen systems

-- First, delete existing pricing classes (they'll be recreated with new structure)
DELETE FROM public.pricing_classes WHERE slug IN ('class-i', 'class-ii', 'class-iii', 'class-iii-plus');

-- Insert new pricing class structure
-- Class I: For aircraft with only oil management (no TKS, no oxygen)
INSERT INTO public.pricing_classes (name, slug, base_monthly, description, features, sort_order, active) VALUES
  (
    'Class I - Standard Aircraft',
    'class-i',
    599.00,
    'For aircraft requiring only oil management (no TKS or oxygen systems)',
    '{"benefits": ["Oil top-offs", "Standard scheduling", "Monthly safety briefing", "Basic maintenance oversight"], "aircraft_requirements": {"has_tks": false, "has_oxygen": false}}'::jsonb,
    1,
    true
  );

-- Class II: For aircraft with TKS ice protection and/or oxygen systems
INSERT INTO public.pricing_classes (name, slug, base_monthly, description, features, sort_order, active) VALUES
  (
    'Class II - Advanced Systems',
    'class-ii',
    899.00,
    'For aircraft with TKS ice protection and/or oxygen systems',
    '{"benefits": ["Oil top-offs", "TKS fluid management (if equipped)", "Oxygen system management (if equipped)", "Priority scheduling", "Advanced maintenance tracking", "Enhanced consumables monitoring"], "aircraft_requirements": {"has_tks_or_oxygen": true}}'::jsonb,
    2,
    true
  );

-- Note: Aircraft classification is now determined by features:
-- - has_tks = false AND has_oxygen = false → Class I
-- - has_tks = true OR has_oxygen = true → Class II

