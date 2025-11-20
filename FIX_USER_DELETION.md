# 🔧 Fix User Deletion Issue

## The Problem

When trying to delete a user from Supabase, you get this error:

```
ERROR: 23502: null value in column "user_id" of relation "onboarding_data" 
violates not-null constraint
```

**Root Cause**: 
- The `onboarding_data` table has `user_id NOT NULL`
- The foreign key is trying to SET NULL when user is deleted
- This creates a conflict!

---

## ✅ Quick Fix (2 minutes)

### 1. Go to Supabase SQL Editor
https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/sql/new

### 2. Run This SQL:

```sql
-- Fix onboarding_data foreign key to CASCADE DELETE
ALTER TABLE public.onboarding_data 
DROP CONSTRAINT IF EXISTS onboarding_data_user_id_fkey;

ALTER TABLE public.onboarding_data 
ADD CONSTRAINT onboarding_data_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Fix memberships (should cascade)
ALTER TABLE public.memberships 
DROP CONSTRAINT IF EXISTS memberships_owner_id_fkey;

ALTER TABLE public.memberships 
ADD CONSTRAINT memberships_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- Fix service_requests (should cascade)
ALTER TABLE public.service_requests 
DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;

ALTER TABLE public.service_requests 
ADD CONSTRAINT service_requests_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- Fix aircraft (should set null - aircraft can exist without owner)
ALTER TABLE public.aircraft 
DROP CONSTRAINT IF EXISTS aircraft_owner_id_fkey;

ALTER TABLE public.aircraft 
ADD CONSTRAINT aircraft_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.user_profiles(id) 
ON DELETE SET NULL;
```

### 3. Click "RUN"

### 4. Try deleting the user again ✅

---

## 📋 What This Does

### Tables with CASCADE (data deleted with user):
- ✅ `onboarding_data` - No orphaned onboarding records
- ✅ `memberships` - No memberships without users
- ✅ `service_requests` - User's requests deleted
- ✅ `service_credits` - Credit records deleted
- ✅ `credit_transactions` - Transaction history deleted
- ✅ `hangar_reservations` - Reservations deleted

### Tables with SET NULL (data preserved):
- ✅ `aircraft` - Aircraft remains, just unassigned
- ✅ `hangar_spaces` - Hangar space becomes available

---

## 🎯 Deletion Flow After Fix:

When you delete a user:
1. ✅ User profile deleted
2. ✅ Onboarding data CASCADE deleted
3. ✅ Memberships CASCADE deleted
4. ✅ Service requests CASCADE deleted
5. ✅ Credits CASCADE deleted
6. ✅ Aircraft ownership SET NULL (aircraft preserved)

No more foreign key errors! 🎉

---

## 📝 Full Migration Available:
See `/migrations/fix_user_deletion_cascade.sql` for complete SQL including all related tables.
