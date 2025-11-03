-- Freedom Aviation - Admin Setup Script
-- This script promotes a user to admin role
--
-- INSTRUCTIONS:
-- 1. First, sign up or create a user account via the app or Supabase Dashboard
-- 2. Note the user's email address
-- 3. Run this script in Supabase SQL Editor, replacing 'YOUR_EMAIL@example.com' with the actual email

-- Option 1: Promote user to admin by email
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'YOUR_EMAIL@example.com';

-- Option 2: Promote user to admin by user ID (UUID)
-- Uncomment and replace YOUR_USER_ID with the actual UUID from auth.users table
-- UPDATE public.user_profiles 
-- SET role = 'admin'
-- WHERE id = 'YOUR_USER_ID';

-- Verify the update
SELECT id, email, full_name, role 
FROM public.user_profiles 
WHERE email = 'YOUR_EMAIL@example.com';

-- Optional: Create a test admin user directly
-- Uncomment and modify to create a test admin account
-- DO NOT use this in production without changing the email and password!
-- 
-- First, insert into auth.users (requires Supabase admin access):
-- INSERT INTO auth.users (
--   instance_id,
--   id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   created_at,
--   updated_at,
--   confirmation_token,
--   email_change,
--   email_change_token_new,
--   recovery_token
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'admin@freedomaviationco.com',
--   crypt('ChangeThisPassword123!', gen_salt('bf')),
--   NOW(),
--   '{"provider":"email","providers":["email"]}',
--   '{"full_name":"Admin User"}',
--   NOW(),
--   NOW(),
--   '',
--   '',
--   '',
--   ''
-- ) RETURNING id;
--
-- Then set the user role to admin:
-- UPDATE public.user_profiles 
-- SET role = 'admin'
-- WHERE email = 'admin@freedomaviationco.com';

