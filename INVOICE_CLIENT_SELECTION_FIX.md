# Invoice Client Selection Fix

## Problem
Client selection dropdown not showing in invoice creation form on the Staff Dashboard.

## Root Cause Found
The RLS policy on `user_profiles` table references a non-existent function `can_view_all_profiles()`, which causes the query to fail when staff/CFI users try to fetch the list of clients (owners).

## QUICK FIX (Run This First!)

**The client dropdown is failing because of a missing database function. Run this SQL script to fix it:**

### Option 1: Simple Fix (Recommended)
Run the script in your Supabase SQL Editor:
```bash
scripts/fix_user_profiles_rls_simple.sql
```

This will:
1. Remove duplicate/broken RLS policies
2. Create clean policies that don't require any functions
3. Allow staff/admin/founder/cfi users to view all profiles (needed for client selection)
4. Test the fix and show your current permissions

### Option 2: With Function (More Advanced)
If you prefer using a helper function:
```bash
scripts/fix_user_profiles_rls.sql
```

This will:
1. Create the missing `can_view_all_profiles()` function
2. Clean up duplicate policies
3. Set up RLS policies using the function

**After running either script:**
1. Refresh your Staff Dashboard page
2. Go to the Invoices tab
3. The Client dropdown should now show all available clients

## Changes Made

### 1. Enhanced Error Handling
- Added `isLoadingOwners` and `ownersError` states to the owners query
- Added console logging to track the owner fetching process
- Added toast notification when owners fail to load

### 2. Improved UI Feedback
Updated the client selection dropdown to show:
- Loading state: "Loading clients..." while fetching
- Empty state: "No clients found" when no owners exist
- Error state: Shows error message if query fails
- Success state: Lists all available clients

### 3. Added Debugging
- Console logs show when owners are being fetched
- Console logs show count of available owners
- Console warns if no owners found in database

## Troubleshooting Steps

### Step 1: Check Browser Console
1. Open the Staff Dashboard
2. Open browser DevTools (F12 or Cmd+Option+I)
3. Go to the Console tab
4. Look for these messages:
   - `🔍 Fetching owners for invoice creation...`
   - `✅ Fetched owners: X` (where X is the count)
   - `👥 Available owners for invoice: X`

If you see an error message, it will help identify the issue.

### Step 2: Check Database for Owners
Run the diagnostic script to check if there are any users with 'owner' role:

```bash
# If using Supabase SQL Editor:
# 1. Go to your Supabase project
# 2. Click on "SQL Editor"
# 3. Run the contents of scripts/check_owners.sql
```

The script will show:
- Count of users by role
- List of all owners
- Total user count
- Owners with aircraft
- RLS policies on user_profiles table

### Step 3: Verify RLS Permissions
The query requires that your logged-in user has one of these roles:
- `admin`
- `staff`
- `founder`

If you're logged in as a different role, the RLS policy will block the query.

To check your role:
```sql
SELECT id, email, full_name, role 
FROM public.user_profiles 
WHERE id = auth.uid();
```

### Step 4: Check for Users Without 'owner' Role
If there are no users with the 'owner' role, you need to:

1. **Option A: Update existing user to 'owner' role**
   ```sql
   UPDATE public.user_profiles
   SET role = 'owner'
   WHERE email = 'user@example.com';  -- Replace with actual email
   ```

2. **Option B: Create a test owner account**
   - Sign up a new user through the app
   - Update their role to 'owner' using the SQL above

### Step 5: Verify the Fix
1. Refresh the Staff Dashboard page
2. Go to the "Invoices" tab
3. Look at the "Create Instruction Invoice" form
4. The "Client *" dropdown should now show:
   - "Loading clients..." initially
   - List of all available clients once loaded
   - "No clients found" if no owners exist in database
   - Error message if query fails

## Expected Behavior

### Normal Flow
1. Page loads → "Loading clients..." shows in dropdown
2. Query completes → Dropdown shows list of clients (owners)
3. Click dropdown → See all clients with their names or emails
4. Select a client → Dropdown shows selected client

### If No Clients Exist
1. Page loads → "Loading clients..." shows in dropdown
2. Query completes → Dropdown shows "No clients found"
3. Console shows: `⚠️ No owners found in database`
4. You need to create at least one user with 'owner' role

### If Query Fails
1. Page loads → "Loading clients..." shows in dropdown
2. Query fails → Red error box appears with error message
3. Toast notification appears with error details
4. Check console for detailed error information

## Common Issues

### Issue 0: Missing function error (MOST COMMON)
**Cause:** RLS policy references non-existent function `can_view_all_profiles()`
**Solution:** Run `scripts/fix_user_profiles_rls_simple.sql` in your Supabase SQL Editor (see QUICK FIX section above)
**Symptoms:**
- Client dropdown shows error or doesn't load
- Console shows "function can_view_all_profiles() does not exist"
- Toast notification shows "Error loading clients"

### Issue 1: "No clients found"
**Cause:** No users with 'owner' role in database
**Solution:** Create or update a user to have 'owner' role (see Step 4 above)

### Issue 2: "Permission denied" or RLS error
**Cause:** Logged-in user doesn't have permission to view all profiles
**Solution:** 
- Log in as admin/staff/founder user
- Or update your user role to one of these:
  ```sql
  UPDATE public.user_profiles
  SET role = 'staff'  -- or 'admin' or 'founder'
  WHERE id = auth.uid();
  ```

### Issue 3: Dropdown still not showing
**Cause:** Browser cache or React state issue
**Solution:**
1. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
2. Clear browser cache
3. Try in incognito/private browsing mode

## Testing the Fix

1. **Test with existing owners:**
   - Navigate to Staff Dashboard → Invoices tab
   - Client dropdown should show all owners
   - Select a client and verify it updates the form

2. **Test without owners:**
   - Temporarily remove all owners from database
   - Refresh page
   - Should show "No clients found" message

3. **Test with RLS error:**
   - Log in as a user without staff/admin permissions
   - Should show error message explaining permission denied

## Files Modified
- `client/src/pages/staff-dashboard.tsx`: Enhanced owners query with error handling and improved UI

## Files Created
- `scripts/fix_user_profiles_rls_simple.sql`: **FIX SCRIPT** - Simple RLS policy fix (recommended)
- `scripts/fix_user_profiles_rls.sql`: **FIX SCRIPT** - RLS policy fix with helper function
- `scripts/check_owners.sql`: Diagnostic script to check database state
- `INVOICE_CLIENT_SELECTION_FIX.md`: This troubleshooting guide

