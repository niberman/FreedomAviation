# Fix: Make Aircraft Optional for Instruction Invoices

## Problem
You're getting a 400 Bad Request error when trying to create an instruction invoice without an aircraft. The database function `create_instruction_invoice` currently requires an aircraft_id and validates it.

## Solution
Run the pre-written SQL script to make aircraft optional for instruction invoices.

## Steps

### 1. Open Supabase SQL Editor
- Go to your Supabase project dashboard  
- Click "SQL Editor" in the left sidebar
- Click "New Query"

### 2. Copy and Run This SQL

```sql
-- Make aircraft_id nullable in invoices table
ALTER TABLE public.invoices 
ALTER COLUMN aircraft_id DROP NOT NULL;

-- Update the create_instruction_invoice function to handle optional aircraft
CREATE OR REPLACE FUNCTION public.create_instruction_invoice(
  p_owner_id UUID,
  p_aircraft_id UUID,  -- Now optional (can be NULL)
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
  -- Verify the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify the CFI ID matches the authenticated user (or user is admin/founder)
  IF p_cfi_id != auth.uid() THEN
    SELECT role INTO v_user_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'founder') THEN
      RAISE EXCEPTION 'CFI ID must match authenticated user';
    END IF;
  END IF;
  
  -- Verify user has CFI, admin, or founder role
  SELECT role INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('cfi', 'admin', 'founder', 'staff') THEN
    RAISE EXCEPTION 'Only CFIs, staff, admins, and founders can create instruction invoices';
  END IF;
  
  -- Verify aircraft exists and belongs to owner (ONLY if aircraft_id is provided)
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
    p_aircraft_id,  -- Can be NULL
    v_invoice_number,
    0, -- Will be updated by finalize_invoice
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

-- Verify the change
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invoices'
  AND column_name = 'aircraft_id';
```

### 3. Click "Run"
Wait for the script to complete (should take 1-2 seconds)

### 4. Test Invoice Creation
1. Go back to your Staff Dashboard
2. Navigate to the Invoices tab
3. Try creating an invoice:
   - Select a client (required)
   - Leave aircraft as "None" (optional)
   - Fill in other required fields
   - Click "Preview Invoice"
   - Click "Send to Client"

It should now work! ✅

## What Changed

### Before:
- `aircraft_id` was `NOT NULL` in database
- Function **required** aircraft and would fail if:
  - Aircraft not found
  - Aircraft doesn't belong to owner
  
### After:
- `aircraft_id` is **nullable** in database
- Function only validates aircraft **if provided**
- You can now create invoices without an aircraft

## Verification

After running the script, you should see:
```
column_name  | is_nullable | data_type
-------------|-------------|----------
aircraft_id  | YES         | uuid
```

This confirms aircraft_id is now optional!

---

**Full script also available in:** `scripts/make-aircraft-optional-in-invoices.sql`


