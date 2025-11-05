-- Freedom Aviation - Create Staff/Admin User Script
-- This script helps create a staff or admin user account
--
-- IMPORTANT: In Supabase, you cannot directly insert into auth.users via SQL
-- due to password hashing requirements. You have two options:
--
-- OPTION 1: Create user via Supabase Dashboard (RECOMMENDED)
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Enter email and password
-- 4. Toggle "Auto Confirm User" ON (so they can log in immediately)
-- 5. Click "Create user"
-- 6. The user_profiles entry will be auto-created by the trigger
-- 7. Then run the UPDATE statement below to set their role
--
-- OPTION 2: Use Supabase Admin API (for programmatic creation)
-- See the commented section below for using the Management API
--
-- ============================================================================
-- STEP 1: Create user via Supabase Dashboard first, then run this:
-- ============================================================================

-- Set the role for an existing user (replace email with actual email)
-- For admin role:
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'YOUR_EMAIL@example.com';

-- OR for CFI (Certified Flight Instructor) role:
-- UPDATE public.user_profiles 
-- SET role = 'cfi'
-- WHERE email = 'YOUR_EMAIL@example.com';

-- Verify the update
SELECT id, email, full_name, role, created_at
FROM public.user_profiles 
WHERE email = 'YOUR_EMAIL@example.com';

-- ============================================================================
-- STEP 2: Optional - Set additional profile information
-- ============================================================================

-- Update full name and phone if needed
-- UPDATE public.user_profiles 
-- SET 
--   full_name = 'Admin User Name',
--   phone = '+1-555-123-4567'
-- WHERE email = 'YOUR_EMAIL@example.com';

-- ============================================================================
-- BULK CREATE: Create multiple staff users at once
-- ============================================================================

-- First, create users via Supabase Dashboard, then run this for multiple users:
-- 
-- UPDATE public.user_profiles 
-- SET role = 'admin'
-- WHERE email IN (
--   'admin1@freedomaviationco.com',
--   'admin2@freedomaviationco.com'
-- );
--
-- UPDATE public.user_profiles 
-- SET role = 'cfi'
-- WHERE email IN (
--   'cfi1@freedomaviationco.com',
--   'cfi2@freedomaviationco.com'
-- );

-- ============================================================================
-- VERIFY: Check all staff users
-- ============================================================================

-- View all admin users
-- SELECT id, email, full_name, role, created_at
-- FROM public.user_profiles 
-- WHERE role = 'admin'
-- ORDER BY created_at DESC;

-- View all CFI users
-- SELECT id, email, full_name, role, created_at
-- FROM public.user_profiles 
-- WHERE role = 'cfi'
-- ORDER BY created_at DESC;

-- View all staff (admin + CFI)
-- SELECT id, email, full_name, role, created_at
-- FROM public.user_profiles 
-- WHERE role IN ('admin', 'cfi')
-- ORDER BY role, created_at DESC;

-- ============================================================================
-- PROGRAMMATIC CREATION (Advanced - Using Supabase Management API)
-- ============================================================================
-- 
-- If you need to create users programmatically, use the Supabase Management API
-- or the Supabase client library. Here's an example using Node.js:
--
-- const { createClient } = require('@supabase/supabase-js');
-- const supabase = createClient(
--   'YOUR_SUPABASE_URL',
--   'YOUR_SERVICE_ROLE_KEY' // ⚠️ Use service role key, not anon key
-- );
--
-- // Create user
-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'admin@freedomaviationco.com',
--   password: 'SecurePassword123!',
--   email_confirm: true, // Auto-confirm email
--   user_metadata: {
--     full_name: 'Admin User'
--   }
-- });
--
-- // Then set role (the trigger will create user_profiles automatically)
-- await supabase
--   .from('user_profiles')
--   .update({ role: 'admin' })
--   .eq('email', 'admin@freedomaviationco.com');
--
-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
--
-- If user_profiles entry doesn't exist after creating auth user:
-- 1. Check if the trigger exists: SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- 2. Manually create the profile:
--
-- INSERT INTO public.user_profiles (id, email, full_name, role)
-- SELECT 
--   id,
--   email,
--   raw_user_meta_data->>'full_name' as full_name,
--   'admin' as role
-- FROM auth.users
-- WHERE email = 'YOUR_EMAIL@example.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
--
-- ============================================================================

