# Deployment Instructions - Invoice Functions Fix

## Overview
This document provides step-by-step instructions to fix the errors reported in your console:

### Issues Fixed:
1. ✅ **404 Error**: Missing `create_instruction_invoice` database function
2. ✅ **Select.Item Error**: Empty value prop causing React errors
3. ✅ **Preload Warnings**: Optimized resource preloading configuration

---

## 🚨 Critical: Database Migration Required

### Issue
The staff dashboard is trying to call `create_instruction_invoice` but it doesn't exist in your Supabase database, resulting in a 404 error:
```
POST https://wsepwuxkwjnsgmkddkjw.supabase.co/rest/v1/rpc/create_instruction_invoice 404 (Not Found)
```

### Solution
Run the migration file to deploy the missing functions to your database.

### Steps to Deploy

#### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `/migrations/deploy_invoice_functions.sql`
5. Copy the entire contents and paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify you see success messages:
   ```
   ✅ create_instruction_invoice function created successfully
   ✅ finalize_invoice function created successfully
   ```

#### Option 2: Supabase CLI
If you have the Supabase CLI installed:

```bash
# Navigate to your project directory
cd /Users/noah/FreedomAviation/FreedomAviation-1

# Push the migration to your database
supabase db push

# Or apply the specific migration file
psql $DATABASE_URL -f migrations/deploy_invoice_functions.sql
```

#### Option 3: Direct Database Connection
If you have direct database access:

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i migrations/deploy_invoice_functions.sql

# Verify the functions exist
SELECT proname FROM pg_proc WHERE proname IN ('create_instruction_invoice', 'finalize_invoice');
```

---

## ✅ Code Fixes Applied

### 1. Select.Item Empty Value Fix
**File**: `client/src/pages/staff-dashboard.tsx`

**What was fixed:**
- Enhanced filtering logic to prevent empty string values in Select components
- Added type coercion to handle potential data inconsistencies
- Added fallback display names for invalid entries

**Technical details:**
The error occurred when owner or aircraft data contained empty string IDs. The new filter:
```typescript
.filter((owner: any) => {
  if (!owner || !owner.id) return false;
  const id = String(owner.id).trim();
  return id !== '' && id !== 'undefined' && id !== 'null';
})
```

### 2. Preload Optimization
**File**: `client/index.html`

**What was fixed:**
- Added documentation about preload warnings
- Added `imagesrcset` attribute to improve browser hints
- Kept the preload for LCP optimization but documented expected warnings

**Note**: The preload warnings are expected when users navigate directly to pages other than the home page. This is normal behavior and doesn't affect functionality.

---

## 🧪 Testing the Fixes

### Test Invoice Creation
1. Log in as a staff member (CFI, admin, or founder role)
2. Navigate to **Staff Dashboard** → **Invoices** tab
3. Click **Create Instruction Invoice**
4. Fill in the form:
   - Select a client
   - Optionally select an aircraft (or choose "None")
   - Enter description, date, hours, and rate
5. Click **Preview Invoice**
6. Click **Send Invoice**
7. **Expected**: Invoice should be created successfully without 404 errors
8. **Previous**: Would show 404 error in console

### Test Select Components
1. In the invoice creation form
2. Open the **Client** dropdown
3. **Expected**: All clients appear with no React errors
4. **Previous**: Console error about empty Select.Item value
5. Try selecting different clients and aircraft

### Verify No Console Errors
Open browser DevTools (F12) and check the Console tab:
- ✅ No `Select.Item` errors
- ✅ No 404 errors for `create_instruction_invoice`
- ⚠️ Preload warnings are expected and can be ignored (they're for performance optimization)

---

## 📝 What Each Function Does

### `create_instruction_invoice`
- Creates a new instruction invoice for flight training
- Handles optional aircraft (for ground instruction)
- Validates permissions (CFI, staff, admin, or founder only)
- Generates unique invoice numbers
- Creates invoice and line items in a single transaction

### `finalize_invoice`
- Changes invoice status from "draft" to "sent"
- Authorizes only the creating CFI, owner, or admin
- Ensures only draft invoices can be finalized
- Updates timestamps automatically

---

## 🔧 Troubleshooting

### "Permission denied for function"
**Cause**: The function exists but doesn't have proper permissions.

**Fix**: Re-run the migration file which includes:
```sql
GRANT EXECUTE ON FUNCTION public.create_instruction_invoice TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_invoice TO authenticated;
```

### "Aircraft owner does not match invoice owner"
**Cause**: Trying to invoice a client for an aircraft they don't own.

**Fix**: Either:
- Select a different aircraft that belongs to the client
- Choose "None" for aircraft (for general instruction)

### "User must be CFI, staff, admin, or founder"
**Cause**: User's role in the database doesn't have invoice creation permissions.

**Fix**: Update the user's role in the `user_profiles` table:
```sql
UPDATE user_profiles 
SET role = 'cfi'  -- or 'staff', 'admin', 'founder'
WHERE id = 'USER_UUID';
```

---

## 🎯 Next Steps

1. **Deploy the migration** using one of the methods above
2. **Clear browser cache** and refresh the page
3. **Test invoice creation** as described above
4. **Monitor console** for any remaining errors

---

## 📞 Support

If you encounter any issues after following these instructions:
1. Check the browser console for specific error messages
2. Verify the migration ran successfully in Supabase
3. Confirm user roles are set correctly in the database
4. Check Supabase logs for any database errors

---

**Last Updated**: November 18, 2025
**Migration File**: `/migrations/deploy_invoice_functions.sql`
**Files Modified**:
- `client/src/pages/staff-dashboard.tsx`
- `client/index.html`




