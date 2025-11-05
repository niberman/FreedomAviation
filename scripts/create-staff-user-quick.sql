-- Freedom Aviation - Quick Staff User Creation
-- 
-- QUICK START:
-- 1. Create user in Supabase Dashboard: Authentication → Users → Add user
-- 2. Replace 'YOUR_EMAIL@example.com' below with the actual email
-- 3. Run this script in Supabase SQL Editor
-- 4. User will be able to log in and access /staff dashboard

-- ============================================================================
-- CREATE ADMIN USER
-- ============================================================================
-- Replace 'YOUR_EMAIL@example.com' with the admin's email address
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'YOUR_EMAIL@example.com';

-- Verify admin was created
SELECT id, email, full_name, role 
FROM public.user_profiles 
WHERE email = 'YOUR_EMAIL@example.com';

-- ============================================================================
-- CREATE CFI (Certified Flight Instructor) USER
-- ============================================================================
-- Uncomment and replace email if you need a CFI instead of admin:
-- UPDATE public.user_profiles 
-- SET role = 'cfi'
-- WHERE email = 'YOUR_EMAIL@example.com';

-- ============================================================================
-- EXAMPLE: Create admin for noah@freedomaviationco.com
-- ============================================================================
-- UPDATE public.user_profiles 
-- SET role = 'admin'
-- WHERE email = 'noah@freedomaviationco.com';

