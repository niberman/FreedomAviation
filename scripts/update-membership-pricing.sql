-- Update Membership Pricing Structure
-- Run this script to update pricing_classes with the new membership tiers

-- First, deactivate old classes
UPDATE public.pricing_classes SET active = false WHERE active = true;

-- Insert/Update Class I – Basic
INSERT INTO public.pricing_classes (name, slug, base_monthly, description, features, sort_order, active)
VALUES (
  'Class I – Basic',
  'class-i-basic',
  199.00,
  'For light piston aircraft such as C172, C182, Archer, Cherokee',
  '{
    "benefits": [
      "1 full detail per month",
      "Weekly readiness & fluid top-offs",
      "Oil & basic maintenance oversight",
      "Avionics database updates",
      "Exterior & interior cleaning",
      "Hangar & ramp coordination",
      "Digital owner portal with logs & notifications"
    ],
    "original_price": 350,
    "introductory_rate": true
  }'::jsonb,
  1,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_monthly = EXCLUDED.base_monthly,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- Insert/Update Class II – Premium
INSERT INTO public.pricing_classes (name, slug, base_monthly, description, features, sort_order, active)
VALUES (
  'Class II – Premium',
  'class-ii-premium',
  799.00,
  'For high-performance / TAA aircraft such as SR20, DA40, Mooney',
  '{
    "benefits": [
      "2 full details per month",
      "Pre-/post-flight readiness service",
      "Oil, TKS, and O₂ management",
      "Composite & paint care",
      "Avionics database management",
      "Priority scheduling for service",
      "Advanced maintenance tracking",
      "Quarterly aircraft performance review",
      "Discounted fuel coordination"
    ],
    "original_price": 1199,
    "introductory_rate": true
  }'::jsonb,
  2,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_monthly = EXCLUDED.base_monthly,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- Insert/Update Class III – Elite
INSERT INTO public.pricing_classes (name, slug, base_monthly, description, features, sort_order, active)
VALUES (
  'Class III – Elite',
  'class-iii-elite',
  1499.00,
  'For turbine singles and light jets such as Vision Jet, TBM',
  '{
    "benefits": [
      "Concierge-level readiness after every flight",
      "4 full details per month + post-flight wipes",
      "Turbine soot & brightwork care",
      "Oil, O₂, and TKS replenishment",
      "Comprehensive insurance coordination",
      "Priority maintenance slots",
      "Annual avionics & software updates",
      "Trip planning & logistics support",
      "Guaranteed aircraft availability"
    ],
    "original_price": 2000,
    "introductory_rate": true
  }'::jsonb,
  3,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_monthly = EXCLUDED.base_monthly,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- Insert/Update Turbo Founders Membership (Hero Product)
INSERT INTO public.pricing_classes (name, slug, base_monthly, description, features, sort_order, active)
VALUES (
  'Turbo Founders Membership',
  'turbo-founders',
  599.00,
  'For SR22T Turbo owners',
  '{
    "benefits": [
      "Everything in Class II Premium, plus:",
      "Priority concierge line and personalized support",
      "Guaranteed 48-hour turnaround",
      "Dedicated maintenance management with proactive tracking",
      "Exclusive member events and brand partnerships",
      "Founding rate locked in for life"
    ],
    "original_price": 1000,
    "introductory_rate": true,
    "badge": "Founders Edition",
    "hero_product": true
  }'::jsonb,
  0,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_monthly = EXCLUDED.base_monthly,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;
