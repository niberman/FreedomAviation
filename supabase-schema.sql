-- Freedom Aviation Database Schema for Supabase
-- Run this in Supabase SQL Editor to create all tables

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create enum types
CREATE TYPE membership_class AS ENUM ('I', 'II', 'III');
CREATE TYPE service_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE maintenance_status AS ENUM ('current', 'due_soon', 'overdue');
CREATE TYPE user_role AS ENUM ('owner', 'cfi', 'admin');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aircraft table
CREATE TABLE public.aircraft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tail_number TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  class TEXT,
  hobbs_hours DECIMAL(10, 2),
  tach_hours DECIMAL(10, 2),
  image_url TEXT,
  owner_id UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memberships table
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  aircraft_id UUID REFERENCES public.aircraft(id),
  class membership_class NOT NULL,
  monthly_rate DECIMAL(10, 2),
  benefits JSONB,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance records table
CREATE TABLE public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_hobbs DECIMAL(10, 2),
  due_tach DECIMAL(10, 2),
  status maintenance_status DEFAULT 'current',
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service requests table
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  service_type TEXT NOT NULL,
  priority TEXT,
  description TEXT,
  requested_date DATE,
  requested_time TIME,
  status service_status DEFAULT 'pending',
  assigned_to UUID REFERENCES public.user_profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instructors table
CREATE TABLE public.instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  certificates JSONB,
  ratings JSONB,
  hourly_rate DECIMAL(10, 2),
  bio TEXT,
  photo_url TEXT,
  availability JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing packages table
CREATE TABLE public.pricing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  class membership_class NOT NULL,
  monthly_base_rate DECIMAL(10, 2) NOT NULL,
  hourly_rate DECIMAL(10, 2),
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

-- RLS Policies for aircraft
CREATE POLICY "Owners can view own aircraft" ON public.aircraft
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

CREATE POLICY "Owners can insert own aircraft" ON public.aircraft
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own aircraft" ON public.aircraft
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can insert aircraft" ON public.aircraft
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update any aircraft" ON public.aircraft
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete aircraft" ON public.aircraft
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for memberships
CREATE POLICY "Users can view own memberships" ON public.memberships
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for maintenance
CREATE POLICY "Aircraft owners can view maintenance" ON public.maintenance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

CREATE POLICY "Admins can insert maintenance" ON public.maintenance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

CREATE POLICY "Admins can update maintenance" ON public.maintenance
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

CREATE POLICY "Admins can delete maintenance" ON public.maintenance
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for service_requests
CREATE POLICY "Users can view own service requests" ON public.service_requests
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

CREATE POLICY "Users can create service requests" ON public.service_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update service requests" ON public.service_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'cfi'))
  );

CREATE POLICY "Admins can delete service requests" ON public.service_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for instructors
CREATE POLICY "Everyone can view active instructors" ON public.instructors
  FOR SELECT USING (active = true);

-- RLS Policies for pricing_packages
CREATE POLICY "Everyone can view active packages" ON public.pricing_packages
  FOR SELECT USING (active = true);

-- Create indexes for performance
CREATE INDEX idx_aircraft_owner ON public.aircraft(owner_id);
CREATE INDEX idx_aircraft_tail ON public.aircraft(tail_number);
CREATE INDEX idx_memberships_user ON public.memberships(user_id);
CREATE INDEX idx_memberships_aircraft ON public.memberships(aircraft_id);
CREATE INDEX idx_maintenance_aircraft ON public.maintenance(aircraft_id);
CREATE INDEX idx_maintenance_status ON public.maintenance(status);
CREATE INDEX idx_service_requests_user ON public.service_requests(user_id);
CREATE INDEX idx_service_requests_aircraft ON public.service_requests(aircraft_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aircraft_updated_at BEFORE UPDATE ON public.aircraft
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_packages_updated_at BEFORE UPDATE ON public.pricing_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample pricing packages
INSERT INTO public.pricing_packages (name, description, class, monthly_base_rate, hourly_rate, features) VALUES
  (
    'Class I - Essential',
    'Perfect for pilots who fly occasionally',
    'I',
    299.00,
    165.00,
    '{"benefits": ["Basic aircraft access", "Standard scheduling", "Monthly safety briefing", "Basic maintenance oversight"]}'
  ),
  (
    'Class II - Premium',
    'Ideal for regular flyers seeking premium service',
    'II',
    599.00,
    155.00,
    '{"benefits": ["Priority scheduling", "Dedicated CFI support", "Advanced maintenance tracking", "Quarterly performance reviews", "Discounted fuel pricing"]}'
  ),
  (
    'Class III - Elite',
    'Ultimate service for serious aviators',
    'III',
    999.00,
    145.00,
    '{"benefits": ["Guaranteed availability", "Personal aviation concierge", "Comprehensive insurance", "Unlimited CFI consultations", "Priority maintenance slots", "Annual avionics upgrades"]}'
  );

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
