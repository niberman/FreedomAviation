# Client Dropdown Fix - Diagnosis & Solution

**Issue**: Clients don't show in dropdown menus on staff dashboard  
**Affects**: Invoice creation, Aircraft assignment, and other client selection menus  
**Root Cause**: Users don't have `role='owner'` set in database  

---

## 🔍 Problem Diagnosis

### How It Works

**Staff Dashboard** → Calls `/api/clients` endpoint
**API Endpoint** → Queries: `SELECT * FROM user_profiles WHERE role = 'owner'`
**If role != 'owner'** → User doesn't appear in dropdown ❌

### Why Clients Are Missing

The `/api/clients` API endpoint (in `server/routes.ts`) specifically filters for:

```typescript
const { data: owners } = await supabase
  .from("user_profiles")
  .select("id, full_name, email, phone, role, created_at")
  .eq("role", "owner")  // ← Only gets users with role='owner'
```

**If users don't have `role='owner'` set**, they won't appear in:
- ❌ Invoice "Select client" dropdown
- ❌ Aircraft "Assign to owner" dropdown  
- ❌ Any other client selection menus

---

## ✅ Solution

Run these SQL scripts in order:

### 1. Diagnose the Problem

**File**: `migrations/diagnose_client_visibility.sql`

**What it does**:
- Shows total user count
- Shows users by role
- Lists all user_profiles
- Checks for whitespace in roles
- Tests the exact query `/api/clients` uses
- Identifies why clients aren't showing

**Run in Supabase SQL Editor** to see current state

### 2. Fix the Problem

**File**: `migrations/fix_client_roles.sql`

**What it does**:
- ✅ Sets all users without a role to `role='owner'`
- ✅ Trims whitespace from existing roles
- ✅ Shows before/after comparison
- ✅ Verifies clients will now appear

**Run in Supabase SQL Editor** to fix the issue

---

## 📋 Step-by-Step Instructions

### Step 1: Diagnose

```bash
# In Supabase SQL Editor:
# 1. Copy/paste contents of migrations/diagnose_client_visibility.sql
# 2. Run it
# 3. Check output - does it say "NO OWNERS FOUND"?
```

### Step 2: Fix

```bash
# In Supabase SQL Editor:
# 1. Copy/paste contents of migrations/fix_client_roles.sql  
# 2. Run it
# 3. Check output - should say "X clients will appear in dropdowns"
```

### Step 3: Verify

```bash
# In Supabase SQL Editor, run:
SELECT id, email, full_name, role 
FROM user_profiles 
WHERE role = 'owner';

# Should return all your client users
```

### Step 4: Test in Dashboard

```bash
# 1. Reload staff dashboard
# 2. Go to "Invoices" tab
# 3. Click "Create Invoice"
# 4. "Select client" dropdown should now show clients ✅
# 5. Go to "Aircraft" tab
# 6. Click "Assign to Owner"
# 7. Dropdown should now show clients ✅
```

---

## 🎯 What Gets Fixed

### Before Fix
```
SELECT * FROM user_profiles WHERE role = 'owner';
-- Returns: 0 rows ❌

Staff Dashboard dropdowns:
  - Invoice: "No clients found" ❌
  - Aircraft: "No owners found" ❌
```

### After Fix
```
SELECT * FROM user_profiles WHERE role = 'owner';
-- Returns: 5 rows (example) ✅

Staff Dashboard dropdowns:
  - Invoice: Shows all 5 clients ✅
  - Aircraft: Shows all 5 owners ✅
```

---

## 🔧 Technical Details

### Why This Happens

When users are created:
1. **Trigger `handle_new_user`** creates `user_profiles` row
2. **Should set** `role='owner'` (default)
3. **But sometimes** role is NULL or has whitespace

**Reasons**:
- Migration timing issues
- Manual user creation without role
- Whitespace in role column
- Trigger not firing properly

### The Fix Script Does

```sql
-- Set NULL roles to 'owner'
UPDATE user_profiles
SET role = 'owner'
WHERE role IS NULL;

-- Trim whitespace from roles  
UPDATE user_profiles
SET role = TRIM(role::text)::user_role
WHERE role::text != TRIM(role::text);
```

---

## 🚨 Important Notes

### Don't Accidentally Make Staff Users "Owners"

If you have users who should be `admin`, `cfi`, `staff`, `ops`, or `founder`, the fix script will NOT change them (it only updates NULL roles).

**To manually set a user as admin/staff**:
```sql
-- Make a specific user an admin
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

### This Fix is Safe

- ✅ Only updates users with NULL roles
- ✅ Doesn't change existing admin/staff/cfi users
- ✅ Includes verification checks
- ✅ Shows before/after comparison

---

## 🔍 Related Files

**Frontend**:
- `client/src/pages/staff-dashboard.tsx` - Invoice creation form
- `client/src/components/clients-table.tsx` - Clients table
- `client/src/components/aircraft-table.tsx` - Aircraft assignment

**Backend**:
- `server/routes.ts` - `/api/clients` endpoint (line 158)
- Filters: `WHERE role = 'owner'`

**Database**:
- Table: `user_profiles`
- Column: `role` (user_role enum)
- Values: 'owner', 'admin', 'cfi', 'staff', 'ops', 'founder'

---

## ✅ Success Criteria

After running the fix, you should see:

1. **In SQL**:
   ```sql
   SELECT role, COUNT(*) FROM user_profiles GROUP BY role;
   -- Should show: owner | 5 (or whatever your count is)
   ```

2. **In Staff Dashboard**:
   - Invoice dropdown shows all clients ✅
   - Aircraft assignment shows all owners ✅
   - Clients table shows all users ✅

3. **In Browser Console**:
   ```
   [ClientsTable] Clients from API: {clients: [{...}, {...}], total: 5}
   ```

---

**Run Order**:
1. `diagnose_client_visibility.sql` (check current state)
2. `fix_client_roles.sql` (apply the fix)
3. Reload staff dashboard (Cmd+R or Ctrl+R)
4. ✅ Clients should now appear in all dropdowns!






