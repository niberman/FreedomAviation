-- Check if there are any users with 'owner' role
-- This script helps diagnose the client selection issue in invoice creation

-- 1. Check all user roles in the database
SELECT 
  role, 
  COUNT(*) as count
FROM public.user_profiles
GROUP BY role
ORDER BY count DESC;

-- 2. List all owners (should show in client dropdown)
SELECT 
  id,
  full_name,
  email,
  role,
  created_at
FROM public.user_profiles
WHERE role = 'owner'
ORDER BY full_name;

-- 3. Check total user count
SELECT COUNT(*) as total_users FROM public.user_profiles;

-- 4. Check if there are any aircraft owners (owners with aircraft)
SELECT 
  up.id,
  up.full_name,
  up.email,
  up.role,
  COUNT(a.id) as aircraft_count
FROM public.user_profiles up
LEFT JOIN public.aircraft a ON a.owner_id = up.id
WHERE up.role = 'owner'
GROUP BY up.id, up.full_name, up.email, up.role
ORDER BY aircraft_count DESC, up.full_name;

-- 5. Check RLS policies on user_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_profiles'
ORDER BY policyname;

