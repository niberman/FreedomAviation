# Complete Fix Checklist - Invoice Creation

## Current Status

✅ **FIXED & DEPLOYED:**
- Client dropdown now working (loading 12 owners successfully)
- Founder and staff roles can now send invoices (just deployed)
- vercel.json restored to working version

❌ **NEEDS DATABASE FIXES:**
Two SQL scripts need to be run in your Supabase SQL Editor

---

## 🚨 PRIORITY 1: Fix RLS Infinite Recursion

**Status:** BLOCKING - Must be fixed first  
**File:** `scripts/EMERGENCY_FIX_RLS_RECURSION.sql`  
**Time:** 30 seconds

### What It Fixes:
The "infinite recursion detected in policy" error that's currently breaking your app.

### How To Fix:
1. Open Supabase SQL Editor
2. Copy and paste this entire script:

```sql
-- Drop all policies to stop recursion
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and CFIs can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles on signup" ON public.user_profiles;
DROP POLICY IF EXISTS "System can create profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- Create SECURITY DEFINER function (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create helper function
CREATE OR REPLACE FUNCTION public.can_view_all_profiles()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() IN ('admin', 'staff', 'founder', 'cfi');
END;
$$ LANGUAGE plpgsql STABLE;

-- Create working policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON public.user_profiles
  FOR SELECT USING (can_view_all_profiles());

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (get_current_user_role() IN ('admin', 'founder'))
  WITH CHECK (get_current_user_role() IN ('admin', 'founder'));

CREATE POLICY "System can insert profiles on signup" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE USING (get_current_user_role() IN ('admin', 'founder'));
```

3. Click "Run"
4. Close all browser tabs with your app
5. Open a fresh tab - recursion error should be gone

**Why This Works:**  
`SECURITY DEFINER` allows the function to bypass RLS when checking roles, preventing the infinite loop.

---

## 🚨 PRIORITY 2: Make Aircraft Optional for Invoices

**Status:** BLOCKING - Invoice creation fails without this  
**File:** `FIX_AIRCRAFT_OPTIONAL.md` or `scripts/make-aircraft-optional-in-invoices.sql`  
**Time:** 30 seconds

### What It Fixes:
The 400 Bad Request error when trying to create an invoice without selecting an aircraft.

### How To Fix:
1. Open Supabase SQL Editor (same place as above)
2. Copy and paste this script:

```sql
-- Make aircraft_id nullable
ALTER TABLE public.invoices 
ALTER COLUMN aircraft_id DROP NOT NULL;

-- Update function to handle optional aircraft
CREATE OR REPLACE FUNCTION public.create_instruction_invoice(
  p_owner_id UUID,
  p_aircraft_id UUID,  -- Now optional!
  p_description TEXT,
  p_hours DECIMAL,
  p_rate_cents INTEGER,
  p_cfi_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_user_role TEXT;
  v_aircraft_owner_id UUID;
BEGIN
  -- Verify authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify CFI ID matches user or user is admin/founder
  IF p_cfi_id != auth.uid() THEN
    SELECT role INTO v_user_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'founder') THEN
      RAISE EXCEPTION 'CFI ID must match authenticated user';
    END IF;
  END IF;
  
  -- Verify user has proper role
  SELECT role INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('cfi', 'admin', 'founder', 'staff') THEN
    RAISE EXCEPTION 'Only CFIs, staff, admins, and founders can create instruction invoices';
  END IF;
  
  -- Only validate aircraft if provided
  IF p_aircraft_id IS NOT NULL THEN
    SELECT owner_id INTO v_aircraft_owner_id
    FROM public.aircraft
    WHERE id = p_aircraft_id;
    
    IF v_aircraft_owner_id IS NULL THEN
      RAISE EXCEPTION 'Aircraft not found';
    END IF;
    
    IF v_aircraft_owner_id != p_owner_id THEN
      RAISE EXCEPTION 'Aircraft does not belong to the specified owner';
    END IF;
  END IF;
  
  -- Verify owner exists
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_owner_id) THEN
    RAISE EXCEPTION 'Owner not found';
  END IF;
  
  -- Generate invoice number
  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  
  -- Insert invoice (aircraft_id can be NULL)
  INSERT INTO public.invoices (
    owner_id,
    aircraft_id,
    invoice_number,
    amount,
    status,
    category,
    created_by_cfi_id
  ) VALUES (
    p_owner_id,
    p_aircraft_id,
    v_invoice_number,
    0,
    'draft',
    'instruction',
    p_cfi_id
  ) RETURNING id INTO v_invoice_id;
  
  -- Insert invoice line
  INSERT INTO public.invoice_lines (
    invoice_id,
    description,
    quantity,
    unit_cents
  ) VALUES (
    v_invoice_id,
    p_description,
    p_hours,
    p_rate_cents
  );
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the fix
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invoices'
  AND column_name = 'aircraft_id';
```

3. Click "Run"
4. Should see output showing `aircraft_id | YES | uuid` (meaning it's now nullable)

**What Changed:**
- Aircraft field in database is now optional (nullable)
- Function only validates aircraft if one is selected
- You can now create invoices without selecting an aircraft

---

## ✅ Testing After Fixes

Once both SQL scripts are run:

### Test 1: Check App Loads
1. Close all browser tabs
2. Open fresh tab to your app
3. Log in as founder
4. Navigate to Staff Dashboard
5. ✅ Should load without "infinite recursion" errors

### Test 2: Create Invoice Without Aircraft
1. Go to Staff Dashboard → Invoices tab
2. Fill out form:
   - Client: Select any client ✅
   - Aircraft: Leave as "None" ✅
   - Description: "Flight instruction"
   - Flight Date: Today
   - Hours: 2
   - Rate: 150
3. Click "Preview Invoice" ✅
4. Click "Send to Client" ✅
5. Should succeed!

### Test 3: Create Invoice With Aircraft
1. Same as above, but select an aircraft
2. Should also work ✅

---

## 📋 Summary of Changes Made

### Code Changes (Already Deployed ✅):
1. **staff-dashboard.tsx** - Enhanced client dropdown with error handling and loading states
2. **server/routes.ts** - Updated authorization to allow founder and staff roles to send invoices
3. **vercel.json** - Reverted to working version with rewrites

### Database Changes (You Need To Run ⚠️):
1. **RLS Policies** - Fix infinite recursion with SECURITY DEFINER functions
2. **Invoices Table** - Make aircraft_id nullable for instruction invoices
3. **create_instruction_invoice Function** - Update to handle optional aircraft

---

## 🎯 Quick Action Plan

**Right now, do these in order:**

1. **[2 minutes]** Open Supabase SQL Editor
2. **[30 seconds]** Run Priority 1 script (RLS fix)
3. **[30 seconds]** Run Priority 2 script (Aircraft optional)
4. **[1 minute]** Close all browser tabs, open fresh one
5. **[2 minutes]** Test invoice creation
6. **[Done!]** Invoice system should be fully working

---

## 📁 Reference Files

- `EMERGENCY_FIX_NOW.md` - Detailed RLS recursion fix guide
- `FIX_AIRCRAFT_OPTIONAL.md` - Detailed aircraft optional fix guide
- `scripts/EMERGENCY_FIX_RLS_RECURSION.sql` - Priority 1 SQL script
- `scripts/make-aircraft-optional-in-invoices.sql` - Priority 2 SQL script
- `INVOICE_CLIENT_SELECTION_FIX.md` - Original troubleshooting guide

---

## ❓ If Something Goes Wrong

### Still seeing recursion error?
- Make sure you ran the entire Priority 1 script
- Check that the functions were created: Run `\df get_current_user_role` in SQL editor
- Try logging out and back in

### Still getting 400 on invoice creation?
- Make sure you ran the entire Priority 2 script
- Check aircraft_id is nullable: Run the verification query at the end of Priority 2 script
- Check browser console for exact error message

### Invoice sends but no email received?
- This is expected for now - email sending requires additional SMTP configuration
- The invoice is still created and marked as "finalized" in the database
- Email functionality can be configured later

---

**Total Time to Fix:** ~5 minutes  
**Difficulty:** Copy & paste SQL scripts  
**Impact:** Complete invoice creation workflow ✅

