-- Add onboarding_data table to track user onboarding progress

CREATE TABLE IF NOT EXISTS public.onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) UNIQUE NOT NULL,
  step TEXT DEFAULT 'welcome',
  personal_info JSONB,
  aircraft_info JSONB,
  membership_selection JSONB,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_data
CREATE POLICY "Users can view own onboarding data" ON public.onboarding_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding data" ON public.onboarding_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding data" ON public.onboarding_data
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add stripe fields to user_profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='stripe_customer_id') THEN
    ALTER TABLE public.user_profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_profiles' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE public.user_profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_data_user_id ON public.onboarding_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON public.user_profiles(stripe_customer_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_data_updated_at
  BEFORE UPDATE ON public.onboarding_data
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_data_updated_at();

-- Grant permissions
GRANT ALL ON public.onboarding_data TO authenticated;
GRANT ALL ON public.onboarding_data TO service_role;

