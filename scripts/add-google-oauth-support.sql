-- Migration: Add Google OAuth Support
-- This updates the user profile trigger to handle Google OAuth metadata
-- Run this in Supabase SQL Editor to enable Google OAuth support

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the function to handle both email/password and OAuth signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    -- Try multiple fields for name:
    -- 1. full_name (from email/password signup)
    -- 2. name (from Google OAuth and other OAuth providers)
    -- 3. email username as fallback
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'owner' -- Default role for new users
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created successfully
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Google OAuth support enabled! The trigger now handles both email/password and OAuth signups.';
END $$;

