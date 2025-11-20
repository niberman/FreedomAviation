# RLS (Row Level Security) Verification Guide
**Date**: November 20, 2025  
**Purpose**: Verify RLS policies match frontend assumptions

---

## Overview

This document provides SQL queries to verify that all RLS policies are correctly configured and match the frontend's expectations.

---

## Part 1: Check Which Tables Have RLS Enabled

```sql
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected**: ALL public tables should have RLS ENABLED

---

## Part 2: List All RLS Policies

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Part 3: Verify Core Table Policies

### user_profiles

```sql
-- Check user_profiles policies
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

**Expected Policies**:
- Owners can view their own profile (SELECT)
- Owners can update their own profile (UPDATE)
- Staff/admin/founder can view all profiles (SELECT)
- Trigger creates profiles (no policy needed)

---

### aircraft

```sql
-- Check aircraft policies
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'aircraft';
```

**Expected Policies**:
- Owners can view their own aircraft (SELECT)
- Owners can update their own aircraft (UPDATE)
- Staff/admin/founder/ops/cfi can view all aircraft (SELECT)
- Staff/admin/founder/ops can create aircraft (INSERT)

---

### service_requests

```sql
-- Check service_requests policies
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'service_requests';
```

**Expected Policies**:
- Owners can view their own requests (SELECT)
- Owners can create their own requests (INSERT)
- Staff/admin/founder/ops/cfi can view all requests (SELECT)
- Staff/admin/founder/ops can update requests (UPDATE)

---

### invoices

```sql
-- Check invoices policies
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'invoices';
```

**Expected Policies**:
- Owners can view their own invoices (SELECT)
- Staff/admin/founder can view all invoices (SELECT)
- Staff/admin/founder/cfi can create invoices (INSERT)
- Staff/admin/founder can update invoices (UPDATE)

---

### memberships

```sql
-- Check memberships policies
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'memberships';
```

**Expected Policies**:
- Owners can view their own memberships (SELECT)
- Staff/admin/founder/ops can view all memberships (SELECT)
- Staff/admin/founder can create memberships (INSERT)
- Staff/admin/founder can update memberships (UPDATE)

---

### maintenance

```sql
-- Check maintenance policies
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'maintenance';
```

**Expected Policies**:
- Owners can view maintenance for their aircraft (SELECT)
- Staff/admin/founder/ops can view all maintenance (SELECT)
- Staff/admin/founder/ops can create maintenance items (INSERT)
- Staff/admin/founder/ops can update maintenance items (UPDATE)

---

### flight_logs

```sql
-- Check flight_logs policies
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'flight_logs';
```

**Expected Policies**:
- Pilots can view their own logs (SELECT)
- Owners can view logs for their aircraft (SELECT)
- Staff/admin/founder/ops/cfi can view all logs (SELECT)
- Pilots can create their own logs (INSERT)
- CFIs can verify logs (UPDATE)

---

## Part 4: Test Policies with Role Simulation

### Test as Owner

```sql
-- Simulate owner viewing their aircraft
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub": "owner-user-id", "role": "authenticated"}';

SELECT * FROM aircraft WHERE owner_id = 'owner-user-id';
-- Should return ONLY the owner's aircraft

SELECT * FROM service_requests WHERE user_id = 'owner-user-id';
-- Should return ONLY the owner's service requests

RESET role;
```

### Test as Staff

```sql
-- Simulate staff viewing all aircraft
SET LOCAL role = 'authenticated';
-- Assume user has role 'staff' in user_profiles

SELECT * FROM aircraft;
-- Should return ALL aircraft

SELECT * FROM service_requests;
-- Should return ALL service requests

RESET role;
```

---

## Part 5: Common RLS Issues to Check

### Issue 1: Circular Dependency

```sql
-- Check if any policy depends on the same table it's securing
SELECT 
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%' || tablename || '%';
```

**Fix**: Ensure policies don't create circular dependencies (e.g., user_profiles policy checking user_profiles.role)

---

### Issue 2: Missing Policies

```sql
-- Find tables with RLS enabled but no policies
SELECT 
  t.tablename,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0;
```

**Fix**: Add appropriate policies for any tables returned

---

### Issue 3: Overly Permissive Policies

```sql
-- Find policies that allow everything
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR qual LIKE '%true%')
ORDER BY tablename;
```

**Review**: Ensure these policies are intentional (e.g., for service role)

---

## Part 6: Frontend RLS Assumptions

### Assumptions Made by Client Code

1. **Owner Role**:
   - Can SELECT their own records (user_profiles, aircraft, service_requests, memberships, invoices)
   - Can INSERT their own records (service_requests, flight_logs)
   - Can UPDATE their own records (user_profiles)

2. **Staff/Admin/Founder/Ops Roles**:
   - Can SELECT all records (all tables)
   - Can INSERT most records (aircraft, service_requests, maintenance, memberships, invoices)
   - Can UPDATE most records (service_requests, maintenance, invoices)

3. **CFI Role**:
   - Can SELECT all aircraft, service_requests, flight_logs
   - Can INSERT invoices for their students
   - Can UPDATE flight_logs (verification)
   - Can UPDATE service_requests (instruction requests)

### Verification Query

```sql
-- Check if actual policies match these assumptions
WITH expected_policies AS (
  SELECT 'owner' as role, 'user_profiles' as table_name, 'SELECT' as cmd UNION ALL
  SELECT 'owner', 'aircraft', 'SELECT' UNION ALL
  SELECT 'owner', 'service_requests', 'SELECT' UNION ALL
  SELECT 'owner', 'service_requests', 'INSERT' UNION ALL
  SELECT 'staff', 'user_profiles', 'SELECT' UNION ALL
  SELECT 'staff', 'aircraft', 'SELECT' UNION ALL
  SELECT 'staff', 'service_requests', 'SELECT' UNION ALL
  SELECT 'staff', 'service_requests', 'UPDATE' UNION ALL
  SELECT 'cfi', 'aircraft', 'SELECT' UNION ALL
  SELECT 'cfi', 'service_requests', 'SELECT' UNION ALL
  SELECT 'cfi', 'invoices', 'INSERT'
)
SELECT 
  ep.role,
  ep.table_name,
  ep.cmd,
  CASE 
    WHEN pp.policyname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM expected_policies ep
LEFT JOIN pg_policies pp ON 
  pp.tablename = ep.table_name 
  AND pp.cmd = ep.cmd
  AND pp.qual LIKE '%' || ep.role || '%'
ORDER BY ep.table_name, ep.role, ep.cmd;
```

---

## Part 7: Fix Missing or Incorrect Policies

### Template for Owner SELECT Policy

```sql
CREATE POLICY "Owners can view their own records"
  ON public.table_name
  FOR SELECT
  USING (owner_id = auth.uid());
```

### Template for Staff/Admin SELECT Policy

```sql
CREATE POLICY "Staff can view all records"
  ON public.table_name
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('staff', 'admin', 'founder', 'ops')
    )
  );
```

### Template for Owner INSERT Policy

```sql
CREATE POLICY "Owners can create their own records"
  ON public.table_name
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());
```

### Template for Staff INSERT Policy

```sql
CREATE POLICY "Staff can create records"
  ON public.table_name
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('staff', 'admin', 'founder', 'ops')
    )
  );
```

---

## Part 8: Testing Checklist

After verifying/fixing RLS policies:

- [ ] All tables have RLS enabled
- [ ] All tables have appropriate policies
- [ ] No circular dependencies
- [ ] No overly permissive policies (except service role)
- [ ] Owner role can access own data
- [ ] Staff role can access all data
- [ ] CFI role can access student data
- [ ] Test in staging environment
- [ ] Test each user role manually
- [ ] Check browser console for RLS errors
- [ ] Verify no "row violates row-level security" errors

---

## Part 9: Common RLS Error Messages

### "row violates row-level security policy"

**Cause**: User trying to access data they don't have permission for

**Fix**: 
1. Check if user has correct role in user_profiles
2. Verify RLS policy exists for that role
3. Check policy conditions are correct

### "permission denied for table"

**Cause**: RLS is enabled but no policies defined

**Fix**: Add appropriate policies for the table

### "infinite recursion detected"

**Cause**: Policy creates circular dependency

**Fix**: Refactor policy to not reference itself

---

## Conclusion

**Before schema cleanup**:
- [ ] Run all verification queries above
- [ ] Fix any missing or incorrect policies
- [ ] Test with each user role
- [ ] Verify frontend works as expected

**Critical**: RLS policies MUST be correct before deleting any tables, as incorrect policies can lock users out of their data!

---

**End of RLS Verification Guide**  
**Generated**: November 20, 2025

