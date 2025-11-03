-- Freedom Aviation - Setup Diagnostic Script
-- This script helps diagnose common setup issues
-- Run this in Supabase SQL Editor to check your setup

-- 1. Check if user_profiles table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
    THEN '✓ user_profiles table exists'
    ELSE '✗ user_profiles table MISSING - Run supabase-schema.sql first!'
  END as status;

-- 2. Check if trigger exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    )
    THEN '✓ Trigger exists'
    ELSE '✗ Trigger MISSING - Run supabase-schema.sql first!'
  END as status;

-- 3. List all users in user_profiles
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN CONCAT('✓ Found ', COUNT(*), ' user(s) in user_profiles')
    ELSE '⚠ No users found in user_profiles'
  END as status
FROM public.user_profiles;

-- 4. Show all users with their roles
SELECT 
  email,
  full_name,
  role,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC;

-- 5. Check for admin users
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN CONCAT('✓ Found ', COUNT(*), ' admin user(s)')
    ELSE '⚠ No admin users found - Run scripts/setup-admin.sql to create one'
  END as status
FROM public.user_profiles
WHERE role = 'admin';

-- 6. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_profiles'
ORDER BY tablename, policyname;

-- 7. Check if user_role enum exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_type 
      WHERE typname = 'user_role'
    )
    THEN '✓ user_role enum exists'
    ELSE '✗ user_role enum MISSING - Run supabase-schema.sql first!'
  END as status;

-- 8. List enum values
SELECT enumlabel as role
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- 9. Check if auth.users table has entries
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users)
    THEN CONCAT('✓ Found ', COUNT(*), ' user(s) in auth.users')
    ELSE '⚠ No users in auth.users - Need to create users first'
  END as status
FROM auth.users;

-- 10. Show users in auth.users that might not have profiles
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  CASE 
    WHEN up.id IS NOT NULL THEN '✓ Has profile'
    ELSE '✗ MISSING PROFILE'
  END as profile_status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

