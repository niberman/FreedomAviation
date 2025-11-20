-- Fix service_requests foreign key to CASCADE DELETE
-- Issue: user_id is NOT NULL but FK tries to SET NULL on delete

ALTER TABLE public.service_requests 
DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;

ALTER TABLE public.service_requests 
ADD CONSTRAINT service_requests_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- Also fix onboarding_data while we're at it
ALTER TABLE public.onboarding_data 
DROP CONSTRAINT IF EXISTS onboarding_data_user_id_fkey;

ALTER TABLE public.onboarding_data 
ADD CONSTRAINT onboarding_data_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Verify the changes
SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS delete_action
FROM pg_constraint
WHERE contype = 'f' 
  AND (conrelid = 'public.service_requests'::regclass OR conrelid = 'public.onboarding_data'::regclass)
  AND confrelid IN ('public.user_profiles'::regclass, 'auth.users'::regclass)
ORDER BY conrelid::regclass::text;
