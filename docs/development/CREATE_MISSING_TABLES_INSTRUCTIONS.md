# 🔧 Fix Missing Tables - Quick Instructions

## The Problem
Your staff dashboard is trying to query these tables that don't exist yet:
- `hangar_spaces`
- `hangar_reservations`
- `service_credits`  
- `credit_transactions`
- `fuel_records`

## ✅ Quick Fix (2 minutes)

### 1. Go to Supabase SQL Editor
https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/sql/new

### 2. Copy & Paste This SQL:

```sql
-- Create missing tables for staff dashboard features

-- Hangar Spaces table
CREATE TABLE IF NOT EXISTS public.hangar_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  size_sqft INTEGER,
  monthly_rate NUMERIC(10, 2),
  status TEXT DEFAULT 'available',
  features TEXT[],
  current_tenant_id UUID REFERENCES public.user_profiles(id),
  current_aircraft_id UUID REFERENCES public.aircraft(id),
  lease_start DATE,
  lease_end DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hangar Reservations table
CREATE TABLE IF NOT EXISTS public.hangar_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hangar_id UUID REFERENCES public.hangar_spaces(id) NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  aircraft_id UUID REFERENCES public.aircraft(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  monthly_rate NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Credits table
CREATE TABLE IF NOT EXISTS public.service_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  credits_total NUMERIC(10, 2) DEFAULT 0,
  credits_used NUMERIC(10, 2) DEFAULT 0,
  credits_remaining NUMERIC(10, 2) DEFAULT 0,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2),
  description TEXT,
  service_request_id UUID REFERENCES public.service_requests(id),
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fuel Records table  
CREATE TABLE IF NOT EXISTS public.fuel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) NOT NULL,
  fuel_type TEXT NOT NULL,
  gallons NUMERIC(10, 2) NOT NULL,
  price_per_gallon NUMERIC(10, 2),
  total_cost NUMERIC(10, 2),
  vendor TEXT,
  location TEXT,
  date DATE DEFAULT CURRENT_DATE,
  hobbs_at_fuel NUMERIC(10, 2),
  tach_at_fuel NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hangar_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangar_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view hangar spaces" ON public.hangar_spaces
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops'))
  );

CREATE POLICY "Staff can manage hangar spaces" ON public.hangar_spaces
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

CREATE POLICY "Users can view own reservations" ON public.hangar_reservations
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops'))
  );

CREATE POLICY "Staff can manage reservations" ON public.hangar_reservations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

CREATE POLICY "Users can view own credits" ON public.service_credits
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops'))
  );

CREATE POLICY "Staff can manage credits" ON public.service_credits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops'))
  );

CREATE POLICY "Staff can create transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder'))
  );

CREATE POLICY "Aircraft owners can view fuel records" ON public.fuel_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aircraft WHERE id = aircraft_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops'))
  );

CREATE POLICY "Staff can manage fuel records" ON public.fuel_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder', 'ops'))
  );

-- Create indexes
CREATE INDEX idx_hangar_spaces_status ON public.hangar_spaces(status);
CREATE INDEX idx_hangar_reservations_user ON public.hangar_reservations(user_id);
CREATE INDEX idx_hangar_reservations_hangar ON public.hangar_reservations(hangar_id);
CREATE INDEX idx_service_credits_owner ON public.service_credits(owner_id);
CREATE INDEX idx_credit_transactions_owner ON public.credit_transactions(owner_id);
CREATE INDEX idx_fuel_records_aircraft ON public.fuel_records(aircraft_id);
CREATE INDEX idx_fuel_records_date ON public.fuel_records(date);
```

### 3. Click "RUN" in the Supabase SQL Editor

### 4. Refresh your staff dashboard

All the 404 errors should be gone! ✅

---

## What These Tables Do:

- **hangar_spaces** - Manage hangar availability and assignments
- **hangar_reservations** - Track hangar bookings
- **service_credits** - Monthly service credit balances
- **credit_transactions** - Credit usage history  
- **fuel_records** - Fuel purchase tracking

---

## After Running the SQL:

The Hangars and Documents tabs in the staff dashboard will work without errors!
