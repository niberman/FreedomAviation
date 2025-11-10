-- Multi-Location Pricing System for Freedom Aviation
-- Add pricing tables to existing Supabase schema

-- 1. Pricing Locations (Hangar Partnerships)
CREATE TABLE public.pricing_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  hangar_cost_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  address TEXT,
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pricing Classes (Service Tiers)
-- Class I: Aircraft with only oil (no TKS, no oxygen)
-- Class II: Aircraft with TKS and/or oxygen systems
CREATE TABLE public.pricing_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  base_monthly DECIMAL(10, 2) NOT NULL,
  description TEXT,
  features JSONB,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Settings for Pricing Assumptions
CREATE TABLE public.settings_pricing_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  labor_rate DECIMAL(10, 2) NOT NULL DEFAULT 30,
  card_fee_pct DECIMAL(5, 2) NOT NULL DEFAULT 3,
  cfi_allocation DECIMAL(10, 2) NOT NULL DEFAULT 42,
  cleaning_supplies DECIMAL(10, 2) NOT NULL DEFAULT 50,
  overhead_per_ac DECIMAL(10, 2) NOT NULL DEFAULT 106,
  avionics_db_per_ac DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Aircraft Pricing Overrides
CREATE TABLE public.aircraft_pricing_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.pricing_locations(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.pricing_classes(id) ON DELETE CASCADE,
  override_monthly DECIMAL(10, 2),
  override_hangar_cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aircraft_id, location_id, class_id)
);

-- 5. Pricing Snapshots (Published Pricing Versions)
CREATE TABLE public.pricing_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  payload JSONB NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID REFERENCES public.user_profiles(id)
);

-- Enable RLS
ALTER TABLE public.pricing_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_pricing_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft_pricing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public can view, admins can manage
CREATE POLICY "Everyone can view active locations" ON public.pricing_locations
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage locations" ON public.pricing_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Everyone can view active classes" ON public.pricing_classes
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage classes" ON public.pricing_classes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Everyone can view assumptions" ON public.settings_pricing_assumptions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage assumptions" ON public.settings_pricing_assumptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Owners can view own aircraft overrides" ON public.aircraft_pricing_overrides
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage overrides" ON public.aircraft_pricing_overrides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Everyone can view snapshots" ON public.pricing_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Admins can publish snapshots" ON public.pricing_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create indexes
CREATE INDEX idx_pricing_locations_slug ON public.pricing_locations(slug);
CREATE INDEX idx_pricing_locations_active ON public.pricing_locations(active);
CREATE INDEX idx_pricing_classes_slug ON public.pricing_classes(slug);
CREATE INDEX idx_pricing_classes_active ON public.pricing_classes(active);
CREATE INDEX idx_aircraft_pricing_overrides_aircraft ON public.aircraft_pricing_overrides(aircraft_id);
CREATE INDEX idx_pricing_snapshots_published_at ON public.pricing_snapshots(published_at DESC);

-- Add updated_at triggers
CREATE TRIGGER update_pricing_locations_updated_at BEFORE UPDATE ON public.pricing_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_classes_updated_at BEFORE UPDATE ON public.pricing_classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_pricing_assumptions_updated_at BEFORE UPDATE ON public.settings_pricing_assumptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aircraft_pricing_overrides_updated_at BEFORE UPDATE ON public.aircraft_pricing_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed pricing locations (hangar partnerships)
INSERT INTO public.pricing_locations (name, slug, hangar_cost_monthly, description, features, active) VALUES
  (
    'Sky Harbour',
    'sky-harbour',
    2000.00,
    'Premium hangar facility with full-service amenities',
    '{"amenities": ["Climate controlled", "24/7 access", "Secure facility", "Concierge service", "Aircraft detailing", "Direct ramp access", "Maintenance support", "Fuel discount"]}'::jsonb,
    true
  ),
  (
    'Freedom Aviation Hangar',
    'freedom-aviation-hangar',
    1500.00,
    'Fox 9 hangar with direct ramp access',
    '{"amenities": ["Climate controlled", "24/7 access", "Secure facility", "Concierge service", "Aircraft detailing", "Direct ramp access", "Maintenance support", "Fuel discount"]}'::jsonb,
    true
  ),
  (
    'Centennial Airport',
    'centennial',
    0.00,
    'Standard tie-down or self-arranged hangar',
    '{"amenities": ["Tie-down included", "Hangar available at owner expense"]}'::jsonb,
    true
  );

-- Seed pricing classes
-- Class I: For aircraft with only oil (no TKS, no oxygen)
-- Class II: For aircraft with TKS and/or oxygen systems
INSERT INTO public.pricing_classes (name, slug, base_monthly, description, features, sort_order, active) VALUES
  (
    'Class I - Standard Aircraft',
    'class-i',
    599.00,
    'For aircraft requiring only oil management (no TKS or oxygen systems)',
    '{"benefits": ["Oil top-offs", "Standard scheduling", "Monthly safety briefing", "Basic maintenance oversight"], "aircraft_requirements": {"has_tks": false, "has_oxygen": false}}'::jsonb,
    1,
    true
  ),
  (
    'Class II - Advanced Systems',
    'class-ii',
    899.00,
    'For aircraft with TKS ice protection and/or oxygen systems',
    '{"benefits": ["Oil top-offs", "TKS fluid management (if equipped)", "Oxygen system management (if equipped)", "Priority scheduling", "Advanced maintenance tracking", "Enhanced consumables monitoring"], "aircraft_requirements": {"has_tks_or_oxygen": true}}'::jsonb,
    2,
    true
  );

-- Seed initial pricing assumptions (single row)
INSERT INTO public.settings_pricing_assumptions (
  labor_rate, 
  card_fee_pct, 
  cfi_allocation, 
  cleaning_supplies, 
  overhead_per_ac, 
  avionics_db_per_ac
) VALUES (
  30.00,   -- labor_rate
  3.00,    -- card_fee_pct
  42.00,   -- cfi_allocation
  50.00,   -- cleaning_supplies
  106.00,  -- overhead_per_ac
  0.00     -- avionics_db_per_ac
);
