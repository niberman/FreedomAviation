# Fix User Invite Error - "Database error saving new user"

## The Problem

When trying to invite users, you're getting this error:
```
Database error saving new user
ERROR: column "role" of relation "user_roles" does not exist
```

This happens because the database trigger is trying to insert into a `user_roles` table instead of the correct `user_profiles` table.

## The Solution

Run these SQL scripts in your Supabase SQL Editor **in order**:

### Step 1: Diagnose (Optional)
First, you can run this to see what's wrong:
```sql
-- File: migrations/diagnose_user_creation_issue.sql
```
This will show you:
- ⚠️ If the problematic `user_roles` table exists
- ✅ The current trigger function code
- ✅ The structure of `user_profiles`

### Step 2: Fix the Trigger (REQUIRED)
Run this to fix the issue:
```sql
-- File: migrations/fix_user_creation_trigger.sql
```
This will:
1. ✅ Drop the old incorrect trigger
2. ✅ Remove the redundant `user_roles` table
3. ✅ Ensure the `user_role` enum exists
4. ✅ Ensure `user_profiles` has the `role` column
5. ✅ Create the correct trigger function (inserts into `user_profiles`)
6. ✅ Verify everything is working

### Step 3: Clean Up Role Whitespace (REQUIRED)
Run this to fix the founder role whitespace issue:
```sql
-- File: migrations/fix_role_whitespace.sql
```
This will trim any whitespace from role values (e.g., `"founder "` → `"founder"`).

## How to Run

1. **Go to Supabase Dashboard** → Your Project
2. **Click on "SQL Editor"** in the left sidebar
3. **Open `migrations/fix_user_creation_trigger.sql`** in your code editor
4. **Copy all the contents**
5. **Paste into Supabase SQL Editor**
6. **Click "Run"** button
7. **Check the output** - you should see green checkmarks ✅
8. **Repeat steps 3-7** for `migrations/fix_role_whitespace.sql`

## Expected Output

After running `fix_user_creation_trigger.sql`, you should see:
```
✅ user_roles table does not exist (good)
✅ user_role enum already exists
✅ role column already exists in user_profiles
✅ User creation trigger fixed!
```

And a verification table showing:
```
Trigger exists                          ✅ YES
user_profiles.role column              ✅ EXISTS
user_role enum                         ✅ EXISTS
user_roles table (should not exist)    ✅ REMOVED
```

## Test It

After running the migrations:

1. Go to your app at `https://www.freedomaviationco.com`
2. Try to **invite a new user** from the staff dashboard
3. It should work without errors! ✅

## What Changed

### Client-Side (Already Done)
- ✅ `client/src/lib/roles.ts` - Now trims whitespace when checking roles
- ✅ `client/src/components/staff-protected-route.tsx` - Trims role after fetching
- ✅ `client/src/pages/login.tsx` - Trims role before redirect logic

### Database (You Need to Run)
- 🔧 Fixed `handle_new_user()` trigger to insert into `user_profiles` (not `user_roles`)
- 🔧 Removed redundant `user_roles` table
- 🔧 Added error handling to prevent future failures
- 🔧 Cleaned up whitespace in existing role data

## Troubleshooting

### Still Getting Errors?

1. **Check the Supabase SQL Editor output** - look for red error messages
2. **Run the diagnostic script** (`diagnose_user_creation_issue.sql`) to see what's wrong
3. **Check your Auth logs** in Supabase Dashboard → Authentication → Logs

### Need to Verify It Worked?

Run this query in SQL Editor:
```sql
-- Check if trigger exists and is correct
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

It should show code that says `INSERT INTO public.user_profiles` (NOT `user_roles`).

## Summary

- **Problem**: Trigger inserting into wrong table + role whitespace issues
- **Solution**: 2 SQL migrations + client code changes (already done)
- **Time**: ~2 minutes to run both migrations
- **Result**: Can invite users + founder logs into staff dashboard

---

**Ready?** Open `migrations/fix_user_creation_trigger.sql` and copy it into Supabase SQL Editor! 🚀

