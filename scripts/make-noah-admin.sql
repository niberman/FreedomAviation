-- Freedom Aviation - Make Noah Admin
-- This script promotes noah@freedomaviationco.com to admin role
-- Run this in Supabase SQL Editor

-- Promote user to admin by email
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'noah@freedomaviationco.com';

-- Verify the update
SELECT id, email, full_name, role 
FROM public.user_profiles 
WHERE email = 'noah@freedomaviationco.com';

