# Integration Test Plan - Schema Alignment Fixes
**Date**: November 20, 2025  
**Branch**: preview  
**Status**: Ready for Testing

---

## 🎯 Test Objective

Verify that all schema alignment fixes work correctly:
1. Code compiles without errors ✅
2. Application runs without crashes
3. Database operations work with new table names
4. No console errors in browser
5. All affected features function properly

---

## ✅ Pre-Test Checklist

Before running integration tests:

- [x] All code fixes applied
- [x] TypeScript compilation passes
- [ ] Database migration run (membership_quotes table created)
- [ ] Dev server starts successfully
- [ ] No console errors on page load

---

## 🗄️ Database Setup Required

### Step 1: Run the Migration

**Using Supabase Dashboard** (Recommended):
1. Go to: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/sql/new
2. Copy contents of: `migrations/create_membership_quotes_table.sql`
3. Paste and click **"Run"**
4. Verify success message

**Verify table was created**:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'membership_quotes';
```

Expected: Should return 1 row with `membership_quotes`

---

## 🧪 Test Suite

### Test 1: Application Startup ✅

**Purpose**: Verify app starts without errors

```bash
npm run dev
```

**Expected**:
- ✅ Vite server starts
- ✅ No TypeScript errors
- ✅ Server runs on port 5000
- ✅ No console errors

**Status**: 
- [ ] PASS
- [ ] FAIL (describe error): ________________

---

### Test 2: Pricing Quote (Login Flow)

**Purpose**: Verify `membership_quotes` table integration

**Steps**:
1. Open: http://localhost:5000/login
2. Click "Sign Up" tab
3. Enter test email and password
4. IF there's a pricing quote saved in session:
   - Complete signup
   - Check browser console for errors
5. Check if quote was saved

**Expected**:
- ✅ No SQL errors in console
- ✅ No "relation does not exist" errors
- ✅ Quote saves to `membership_quotes` (not `support_tickets`)

**Database Verification**:
```sql
SELECT * FROM membership_quotes 
ORDER BY created_at DESC 
LIMIT 5;
```

**Status**: 
- [ ] PASS
- [ ] FAIL (describe error): ________________
- [ ] SKIPPED (reason): ________________

---

### Test 3: Pricing Calculator Quote

**Purpose**: Verify `membership_quotes` table integration

**Steps**:
1. Open: http://localhost:5000/pricing
2. Scroll to pricing calculator
3. Log in as test user (if not already)
4. Select:
   - Tier: Class II
   - Hours: 20-50
   - Location: Any
5. Click "Get Quote"
6. Check browser console

**Expected**:
- ✅ No SQL errors
- ✅ Success toast appears
- ✅ Quote saved to `membership_quotes`

**Database Verification**:
```sql
SELECT 
  tier_name, 
  total_monthly, 
  status, 
  created_at 
FROM membership_quotes 
WHERE notes LIKE '%pricing_calculator%'
ORDER BY created_at DESC 
LIMIT 5;
```

**Status**: 
- [ ] PASS
- [ ] FAIL (describe error): ________________

---

### Test 4: Oil Top-Off Request (Staff Dashboard)

**Purpose**: Verify `service_requests` integration (was `consumable_events`)

**Steps**:
1. Log in as admin/staff user
2. Go to: http://localhost:5000/staff or /admin
3. Navigate to aircraft management
4. Find an aircraft
5. Request "Oil Top-Off" service
6. Check browser console

**Expected**:
- ✅ No SQL errors
- ✅ Creates `service_requests` record (not `consumable_events`)
- ✅ Service type: "Oil Top-Off"
- ✅ Success message appears

**Database Verification**:
```sql
SELECT 
  service_type, 
  description, 
  priority, 
  status 
FROM service_requests 
WHERE service_type = 'Oil Top-Off'
ORDER BY created_at DESC 
LIMIT 5;
```

**Status**: 
- [ ] PASS
- [ ] FAIL (describe error): ________________
- [ ] SKIPPED (no staff access): ________________

---

### Test 5: Flight Instruction Request

**Purpose**: Verify `service_requests` integration (was `instruction_requests`)

**Steps**:
1. Log in as owner with aircraft
2. Go to: http://localhost:5000/dashboard
3. Click "Request Flight Instruction" (in Quick Actions or similar)
4. Fill out form:
   - Date: Tomorrow
   - Time: 10:00 AM
   - Type: Flight Instruction
   - Duration: 2 hours
5. Submit request
6. Check browser console

**Expected**:
- ✅ No SQL errors
- ✅ Creates `service_requests` record (not `instruction_requests`)
- ✅ Service type: "Flight Instruction"
- ✅ Request details saved correctly

**Database Verification**:
```sql
SELECT 
  service_type, 
  description, 
  requested_date, 
  requested_time, 
  notes,
  status 
FROM service_requests 
WHERE service_type = 'Flight Instruction'
ORDER BY created_at DESC 
LIMIT 5;
```

**Status**: 
- [ ] PASS
- [ ] FAIL (describe error): ________________

---

### Test 6: Type Safety Check

**Purpose**: Verify TypeScript types match database

**Run**:
```bash
npm run build
```

**Expected**:
- ✅ Build completes successfully
- ✅ 0 TypeScript errors
- ✅ 0 type mismatches
- ✅ All imports resolve

**Status**: ✅ PASS (already verified)

---

### Test 7: Browser Console Check

**Purpose**: Catch any runtime errors

**Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console
4. Navigate through app:
   - Home page
   - Login page
   - Dashboard (if logged in)
   - Pricing page
   - Staff pages (if staff)
5. Check for errors

**Expected**:
- ✅ No SQL errors
- ✅ No "relation does not exist" errors
- ✅ No "column does not exist" errors
- ✅ Only normal app logs

**Common Errors to Look For**:
```
❌ relation "public.support_tickets" does not exist
❌ relation "public.consumable_events" does not exist
❌ relation "public.instruction_requests" does not exist
❌ column "hobbs_time" does not exist
```

**Status**: 
- [ ] PASS
- [ ] FAIL (list errors): ________________

---

## 📊 Database Schema Verification

Run these queries in Supabase SQL Editor to verify actual schema:

### Check Which Tables Exist

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'support_tickets',
  'consumable_events',
  'instruction_requests',
  'email_notifications',
  'membership_quotes',
  'membership_tiers'
)
ORDER BY tablename;
```

**What to Expect**:
- ✅ `membership_quotes` - Should exist (after migration)
- ❓ `email_notifications` - Check if exists
- ❌ `support_tickets` - Should NOT exist (or will be unused)
- ❌ `consumable_events` - Should NOT exist (or will be unused)
- ❌ `instruction_requests` - Should NOT exist (or will be unused)
- ❓ `membership_tiers` - Check if exists

---

### Check Aircraft Columns

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'aircraft' 
AND column_name IN ('hobbs_time', 'tach_time', 'hobbs_hours', 'tach_hours')
ORDER BY column_name;
```

**What to Expect**:
- ✅ `hobbs_hours` - Should exist
- ✅ `tach_hours` - Should exist
- ❓ `hobbs_time` - May still exist (pending migration)
- ❓ `tach_time` - May still exist (pending migration)

---

### Check Service Requests Schema

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_requests'
ORDER BY ordinal_position;
```

**Required Columns**:
- ✅ `id`, `aircraft_id`, `user_id`
- ✅ `service_type`, `description`, `status`
- ✅ `requested_date`, `requested_time`
- ✅ `is_extra_charge`, `credits_used`
- ✅ `priority`, `notes`

---

## 🔍 Integration Test Results

### Code Integration ✅

| Component | Status | Notes |
|-----------|--------|-------|
| TypeScript Compilation | ✅ PASS | 0 errors, builds successfully |
| Type Definitions | ✅ PASS | membership_quotes types added |
| Column Names | ✅ PASS | hobbs_hours/tach_hours used |
| Table References | ✅ PASS | No deprecated tables referenced |

---

### Database Integration ⏳

| Component | Status | Action Required |
|-----------|--------|-----------------|
| membership_quotes table | ⏳ PENDING | Run migration SQL |
| support_tickets cleanup | ⏳ PENDING | Verify not needed |
| consumable_events cleanup | ⏳ PENDING | Verify not needed |
| instruction_requests cleanup | ⏳ PENDING | Verify not needed |
| email_notifications | ⏳ PENDING | Verify exists |

---

### Feature Testing ⏳

| Feature | Status | Notes |
|---------|--------|-------|
| Signup with Quote | ⏳ PENDING | Needs migration first |
| Pricing Calculator | ⏳ PENDING | Needs migration first |
| Oil Top-Off | ⏳ PENDING | Should work (uses service_requests) |
| Flight Instruction | ⏳ PENDING | Should work (uses service_requests) |

---

## 🚀 Next Steps

### Immediate (Required)

1. **Run Database Migration**
   ```
   Open: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/sql/new
   Run: migrations/create_membership_quotes_table.sql
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Manual Feature Testing**
   - Test each feature from the test suite above
   - Check browser console for errors
   - Verify database records are created correctly

---

## 📝 Test Results Template

```
Date: _______________
Tester: _______________
Branch: preview

Database Migration:
[ ] membership_quotes table created
[ ] RLS policies verified
[ ] Indexes created

Application Tests:
[ ] Test 1: App Startup - PASS/FAIL
[ ] Test 2: Pricing Quote (Login) - PASS/FAIL  
[ ] Test 3: Pricing Calculator - PASS/FAIL
[ ] Test 4: Oil Top-Off - PASS/FAIL
[ ] Test 5: Flight Instruction - PASS/FAIL
[ ] Test 6: Type Safety - PASS
[ ] Test 7: Console Check - PASS/FAIL

Issues Found:
_________________________________
_________________________________
_________________________________

Overall Status: PASS / FAIL / PARTIAL
Ready for Production: YES / NO
```

---

## 🐛 Troubleshooting

### If You See: "relation does not exist"

**For membership_quotes**:
- Run the migration: `migrations/create_membership_quotes_table.sql`

**For support_tickets/consumable_events/instruction_requests**:
- This is expected - we removed these references
- Should NOT see these errors (we replaced them)

### If You See: Column Errors

Check aircraft table has correct columns:
```sql
\d aircraft  -- in psql
```

Should use `hobbs_hours`, `tach_hours` (not hobbs_time, tach_time)

### If Features Don't Work

1. Check browser console for specific error
2. Check network tab for failed API calls
3. Verify user has correct role in database
4. Check RLS policies are correct

---

**END OF TEST PLAN**  
**Next**: Run migration then execute test suite

