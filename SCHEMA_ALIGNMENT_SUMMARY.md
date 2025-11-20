# Schema Alignment Audit - Executive Summary
**Date**: November 20, 2025  
**Status**: ⚠️ CRITICAL ISSUES FOUND - DO NOT PROCEED WITH SCHEMA CLEANUP

---

## 🚨 TL;DR - What You Need to Know

**STOP**: Do NOT delete any database tables until code fixes are applied!

**Found**: 7 schema mismatches that could break the application  
**Impact**: HIGH - Multiple features reference non-existent or deprecated tables  
**Time to Fix**: 2-4 hours of development + 1 hour of testing  
**Risk**: Code will break if tables are deleted before fixes are applied

---

## 📊 Quick Statistics

- ✅ **16 tables** correctly used and aligned
- ❌ **4 tables** referenced but may not exist
- ⚠️ **2 column names** deprecated but still in use  
- 🔧 **3 type files** with conflicting definitions

---

## 🔥 Critical Issues (Fix First!)

### 1. `support_tickets` table ⚠️ HIGH PRIORITY
**Location**: Used in login flow and pricing calculator  
**Impact**: Pricing quote requests will fail  
**Fix**: Replace with `membership_quotes` table (20 minutes)

### 2. `consumable_events` table ⚠️ MEDIUM PRIORITY
**Location**: Used in aircraft oil top-off feature  
**Impact**: Staff cannot track consumables  
**Fix**: Replace with `service_requests` or create table (15 minutes)

### 3. `instruction_requests` table ⚠️ MEDIUM PRIORITY
**Location**: Used in flight instruction request sheet  
**Impact**: Users cannot request flight instruction  
**Fix**: Replace with `service_requests` or verify table exists (15 minutes)

### 4. `hobbs_time`/`tach_time` columns ⚠️ CRITICAL
**Location**: TypeScript types in `shared/database-types.ts`  
**Impact**: Type mismatches if migration is run  
**Fix**: Rename to `hobbs_hours`/`tach_hours` (5 minutes)

---

## 📋 Action Plan

### Step 1: Read the Full Reports (5 minutes)
- [ ] Read `SCHEMA_ALIGNMENT_AUDIT_REPORT.md` (comprehensive findings)
- [ ] Read `SCHEMA_FIXES.md` (ready-to-apply fixes)

### Step 2: Apply Critical Fixes (1-2 hours)
- [ ] Fix #1: Update `support_tickets` → `membership_quotes`
- [ ] Fix #2: Update `consumable_events` → `service_requests`
- [ ] Fix #3: Update `instruction_requests` → `service_requests`
- [ ] Fix #4: Rename `hobbs_time`/`tach_time` in types

### Step 3: Test Everything (1 hour)
- [ ] Run `npm run build` - verify TypeScript compiles
- [ ] Run `npm test` - verify all tests pass
- [ ] Test affected features manually:
  - Signup with pricing quote
  - Pricing calculator
  - Aircraft oil top-off
  - Flight instruction request
  - Email notifications

### Step 4: Verify Database Alignment (30 minutes)
- [ ] Confirm actual Supabase schema matches expected schema
- [ ] Run verification queries provided in fix document
- [ ] Check RLS policies are correct

### Step 5: Deploy (15 minutes)
- [ ] Create database tables if needed (see SCHEMA_FIXES.md)
- [ ] Deploy server code changes
- [ ] Deploy client code changes
- [ ] Verify in production

### Step 6: Run Pending Migrations (30 minutes)
**ONLY AFTER ALL ABOVE STEPS ARE COMPLETE**:
- [ ] Run `cleanup_aircraft_duplicate_columns.sql` on staging
- [ ] Test thoroughly
- [ ] Run on production
- [ ] Run `resolve_user_roles_duplication.sql` on staging
- [ ] Test thoroughly
- [ ] Run on production

---

## 📁 Files Requiring Changes

**HIGH PRIORITY** (must fix):
```
client/src/pages/login.tsx                          (Line 199)
client/src/components/unified-pricing-calculator.tsx (Line 105)
client/src/components/aircraft-table.tsx            (Line 141)
client/src/components/request-instruction-sheet.tsx (Line 77)
shared/database-types.ts                            (Line 762-763)
```

**MEDIUM PRIORITY** (should verify):
```
server/routes/email-notifications.ts               (Verify table exists)
```

---

## ⚠️ What NOT To Do

❌ **DO NOT** delete tables from Supabase before fixing code  
❌ **DO NOT** run cleanup migrations before fixing code  
❌ **DO NOT** skip testing in staging environment  
❌ **DO NOT** deploy without testing all affected features  
❌ **DO NOT** proceed if TypeScript compilation fails  

---

## ✅ What To Do

✅ **DO** read the full audit report  
✅ **DO** apply all fixes in the fixes document  
✅ **DO** test thoroughly in staging first  
✅ **DO** backup production database before migrations  
✅ **DO** verify each feature still works after changes  

---

## 🎯 Success Criteria

Before proceeding with schema cleanup, verify:

- [ ] All TypeScript files compile without errors
- [ ] All tests pass
- [ ] Login flow with pricing quote works
- [ ] Pricing calculator works
- [ ] Aircraft features work
- [ ] Flight instruction requests work
- [ ] Email notifications work
- [ ] No console errors in browser
- [ ] All Supabase queries succeed
- [ ] Staging environment tested and working

---

## 📞 Need Help?

If you encounter any issues:

1. Check the full audit report for details: `SCHEMA_ALIGNMENT_AUDIT_REPORT.md`
2. Check the fixes document for solutions: `SCHEMA_FIXES.md`
3. Review the pending migrations in: `migrations/` directory
4. Check existing documentation in: `docs/` directory

---

## 🔍 Next Steps After Fixes

Once all fixes are applied and tested:

1. **Execute pending migrations**:
   - `cleanup_aircraft_duplicate_columns.sql`
   - `resolve_user_roles_duplication.sql`

2. **Remove unused tables** (if confirmed unused):
   - `support_tickets` (if replaced)
   - `consumable_events` (if replaced)
   - `instruction_requests` (if replaced)
   - `membership_tiers` (if not needed)

3. **Consolidate type system**:
   - Make `client/src/lib/types/database.ts` the single source of truth
   - Refactor or deprecate other type files

4. **Update documentation**:
   - Document any schema changes
   - Update API documentation
   - Update developer guide

---

## 📈 Timeline

**Estimated Total Time**: 4-5 hours

- Code fixes: 1-2 hours
- Testing: 1 hour  
- Verification: 30 minutes
- Deployment: 15 minutes
- Migrations: 30 minutes
- Documentation: 30-60 minutes

---

**REMEMBER**: The goal is to align the codebase with the ACTUAL schema BEFORE cleaning up the schema. Do NOT delete tables until all code references are fixed!

---

**End of Summary**  
**Generated**: November 20, 2025  
**For**: Freedom Aviation Schema Alignment Project

---

## Quick Command Reference

```bash
# Check TypeScript compilation
npm run build

# Run tests
npm test

# Start dev server
npm run dev

# Check for type errors
npx tsc --noEmit

# Search for table references
grep -r "from.*support_tickets" client/src/
grep -r "from.*consumable_events" client/src/
grep -r "from.*instruction_requests" client/src/
grep -r "hobbs_time" shared/
```

