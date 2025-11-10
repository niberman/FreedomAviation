-- Add average monthly flight hours column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS average_monthly_flight_hours INTEGER DEFAULT NULL;

-- Add stripe customer and subscription IDs to track Stripe data
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT DEFAULT NULL;

-- Add membership pricing info to memberships table
ALTER TABLE public.memberships
ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT DEFAULT NULL;

-- Create index on stripe customer ID for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON public.user_profiles(stripe_customer_id);

-- Add comment to explain the new column
COMMENT ON COLUMN public.user_profiles.average_monthly_flight_hours IS 'Average monthly flight hours reported during onboarding';
COMMENT ON COLUMN public.user_profiles.stripe_customer_id IS 'Stripe customer ID for subscription management';
COMMENT ON COLUMN public.user_profiles.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN public.memberships.monthly_rate IS 'Monthly membership rate in dollars';
COMMENT ON COLUMN public.memberships.stripe_price_id IS 'Stripe price ID for recurring billing';
