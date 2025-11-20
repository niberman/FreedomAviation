-- Fix foreign key constraints to allow user deletion
-- Issue: user_id in onboarding_data is NOT NULL but FK tries to SET NULL on delete

-- 1. Fix onboarding_data foreign key
ALTER TABLE public.onboarding_data 
DROP CONSTRAINT IF EXISTS onboarding_data_user_id_fkey;

ALTER TABLE public.onboarding_data 
ADD CONSTRAINT onboarding_data_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 2. Check and fix other tables that might have similar issues

-- Aircraft: Should SET NULL (aircraft can exist without owner)
ALTER TABLE public.aircraft 
DROP CONSTRAINT IF EXISTS aircraft_owner_id_fkey;

ALTER TABLE public.aircraft 
ADD CONSTRAINT aircraft_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.user_profiles(id) 
ON DELETE SET NULL;

-- Memberships: Should CASCADE (no membership without user)
ALTER TABLE public.memberships 
DROP CONSTRAINT IF EXISTS memberships_owner_id_fkey;

ALTER TABLE public.memberships 
ADD CONSTRAINT memberships_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- Service requests: Should CASCADE (delete requests when user deleted)
ALTER TABLE public.service_requests 
DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;

ALTER TABLE public.service_requests 
ADD CONSTRAINT service_requests_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- Hangar reservations: Should CASCADE
ALTER TABLE public.hangar_reservations 
DROP CONSTRAINT IF EXISTS hangar_reservations_user_id_fkey;

ALTER TABLE public.hangar_reservations 
ADD CONSTRAINT hangar_reservations_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- Service credits: Should CASCADE
ALTER TABLE public.service_credits 
DROP CONSTRAINT IF EXISTS service_credits_owner_id_fkey;

ALTER TABLE public.service_credits 
ADD CONSTRAINT service_credits_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- Credit transactions: Should CASCADE
ALTER TABLE public.credit_transactions 
DROP CONSTRAINT IF EXISTS credit_transactions_owner_id_fkey;

ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- Fuel records: Keep existing behavior (likely SET NULL or CASCADE based on aircraft)

-- Hangar spaces: Should SET NULL (hangar can exist without tenant)
ALTER TABLE public.hangar_spaces 
DROP CONSTRAINT IF EXISTS hangar_spaces_current_tenant_id_fkey;

ALTER TABLE public.hangar_spaces 
ADD CONSTRAINT hangar_spaces_current_tenant_id_fkey 
FOREIGN KEY (current_tenant_id) 
REFERENCES public.user_profiles(id) 
ON DELETE SET NULL;

-- Verify the changes
SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  confupdtype AS on_update,
  confdeltype AS on_delete,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS delete_action
FROM pg_constraint
WHERE contype = 'f' 
  AND confrelid = 'public.user_profiles'::regclass
ORDER BY conrelid::regclass::text;
