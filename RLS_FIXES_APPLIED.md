# RLS Fixes Applied - November 14, 2025

## Summary

This document describes all the fixes applied to resolve RLS (Row Level Security) issues where client-side queries were being blocked by database policies.

## Problem

Several components in the client application were making direct Supabase queries that were subject to RLS policies. When these policies blocked the queries (due to missing permissions or incorrect policy configuration), users would see empty dropdowns, missing data, or error messages.

## Solution Approach

Instead of relying on RLS policies for staff operations, we created API endpoints that use the Supabase **service role** client to bypass RLS. This ensures that staff members can access the data they need while maintaining security at the API level through role-based authentication.

---

## Fixes Applied

### 1. ✅ Client Dropdown in Invoice Creation

**Issue:** Staff dashboard invoice creation form couldn't load the list of clients (owners) for the dropdown.

**Location:** `client/src/pages/staff-dashboard.tsx:78-111`

**Root Cause:** Direct query to `user_profiles` table was blocked by RLS policy.

**Fix:** Changed to use `/api/clients` endpoint with service role access.

**Before:**
```typescript
const { data: owners = [] } = useQuery({
  queryKey: ['/api/owners'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('role', 'owner')
      .order('full_name');
    // ...
  },
});
```

**After:**
```typescript
const { data: owners = [] } = useQuery({
  queryKey: ['/api/clients', session?.access_token],
  queryFn: async () => {
    const accessToken = session?.access_token;
    const response = await fetch('/api/clients', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    return data.clients || [];
  },
  enabled: !!session?.access_token,
});
```

**Result:** ✅ Client dropdown now loads successfully

---

### 2. ✅ Aircraft Dropdown in Invoice Creation

**Issue:** Staff dashboard invoice creation couldn't load aircraft for the dropdown.

**Location:** `client/src/pages/staff-dashboard.tsx:131-158`

**Root Cause:** Direct query to `aircraft` table may be blocked by RLS.

**Fix:** 
1. Created new `/api/aircraft` endpoint (see below)
2. Updated client query to use the endpoint

**Before:**
```typescript
const { data: aircraft = [] } = useQuery({
  queryKey: ['/api/aircraft'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('aircraft')
      .select('id, tail_number, owner_id')
      .order('tail_number');
    // ...
  },
});
```

**After:**
```typescript
const { data: aircraft = [] } = useQuery({
  queryKey: ['/api/aircraft', 'dropdown', session?.access_token],
  queryFn: async () => {
    const accessToken = session?.access_token;
    const response = await fetch('/api/aircraft', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    return data.aircraft || [];
  },
  enabled: !!session?.access_token,
});
```

**Result:** ✅ Aircraft dropdown now loads with service role access

---

### 3. ✅ Aircraft Table in Staff Dashboard

**Issue:** The aircraft management table in staff dashboard couldn't load aircraft with owner details.

**Location:** `client/src/pages/staff-dashboard.tsx:161-211`

**Root Cause:** Complex nested query with owner relations was blocked by RLS.

**Fix:** Changed to use the new `/api/aircraft` endpoint which includes owner details.

**Before:**
```typescript
const { data: aircraftFull = [] } = useQuery({
  queryKey: ['/api/aircraft/full'],
  queryFn: async () => {
    let query = supabase
      .from('aircraft')
      .select(`
        id, tail_number, make, model, class, base_location, owner_id,
        owner:owner_id(full_name, email)
      `)
      .order('tail_number');
    // Complex error handling and fallback logic...
  }
});
```

**After:**
```typescript
const { data: aircraftFull = [] } = useQuery({
  queryKey: ['/api/aircraft', 'full', session?.access_token],
  queryFn: async () => {
    const response = await fetch('/api/aircraft', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const result = await response.json();
    const data = result.aircraft || [];
    // Simple transformation...
  },
  enabled: !!session?.access_token,
});
```

**Result:** ✅ Aircraft table loads with all details and owner information

---

## New API Endpoints Created

### `/api/aircraft` (GET)

**Purpose:** Fetch all aircraft with owner details for staff dashboard

**Authentication:** Requires valid JWT token

**Authorization:** User must have role: `admin`, `staff`, `founder`, `cfi`, or `ops`

**Implementation:** `server/routes.ts:290-405`

**Features:**
- Uses Supabase service role to bypass RLS
- Returns aircraft with nested owner details
- Includes CORS headers for proper cross-origin requests
- Comprehensive error handling and logging

**Response Format:**
```json
{
  "aircraft": [
    {
      "id": "uuid",
      "tail_number": "N123FA",
      "make": "Cirrus",
      "model": "SR22T",
      "class": "High Performance",
      "base_location": "KAPA",
      "owner_id": "uuid",
      "has_tks": true,
      "has_oxygen": true,
      "owner": {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "total": 1
}
```

---

## Files Modified

### Client Files
1. ✅ `client/src/pages/staff-dashboard.tsx`
   - Lines 78-111: Client dropdown query
   - Lines 131-158: Aircraft dropdown query  
   - Lines 161-211: Aircraft table query

### Server Files
1. ✅ `server/routes.ts`
   - Lines 290-405: New `/api/aircraft` endpoint

### Documentation
1. ✅ `RLS_AUDIT_REPORT.md` - Comprehensive audit of all RLS-related code
2. ✅ `RLS_FIXES_APPLIED.md` - This document

---

## Testing Checklist

### ✅ Invoice Creation (Staff Dashboard)
- [x] Client dropdown loads and shows all owners
- [x] Client dropdown is searchable
- [x] Can select a client
- [x] Aircraft dropdown loads after selecting client
- [x] Aircraft dropdown shows only selected client's aircraft
- [x] Can select aircraft (or leave as "None" for ground instruction)
- [x] Can create invoice successfully

### ✅ Aircraft Management (Staff Dashboard)
- [x] Aircraft table loads with all aircraft
- [x] Shows owner names/emails for each aircraft
- [x] Shows aircraft details (make, model, class, location)
- [x] No permission errors or empty tables

### ⏳ Remaining Items from Audit (Lower Priority)
- [ ] Verify owner service request creation works
- [ ] Test aircraft creation by staff for owners
- [ ] Verify all RLS policies are documented

---

## Benefits

1. **Reliability:** Staff operations no longer depend on complex RLS policies
2. **Performance:** Single API call vs multiple nested Supabase queries
3. **Security:** Authorization enforced at API level with role checks
4. **Maintainability:** Centralized business logic in API endpoints
5. **Error Handling:** Better error messages and logging
6. **Consistency:** All staff operations follow the same pattern

---

## Pattern for Future Development

When building new features that require staff to access data across multiple owners:

1. **DON'T:** Make direct Supabase queries from client code
   ```typescript
   // ❌ BAD - Subject to RLS
   const { data } = await supabase.from('table').select('*');
   ```

2. **DO:** Create an API endpoint with service role access
   ```typescript
   // ✅ GOOD - Uses API with service role
   const response = await fetch('/api/resource', {
     headers: {
       'Authorization': `Bearer ${accessToken}`,
     }
   });
   ```

3. **API Endpoint Pattern:**
   ```typescript
   app.get("/api/resource", async (req, res) => {
     // 1. Authenticate user
     const token = extractToken(req);
     const user = await verifyToken(token);
     
     // 2. Check authorization (role-based)
     const profile = await fetchProfile(user.id);
     if (!isStaffRole(profile.role)) {
       return res.status(403).json({ error: "Forbidden" });
     }
     
     // 3. Use service role client
     const { data } = await supabase  // service role
       .from('table')
       .select('*');
     
     // 4. Return data
     res.json({ data });
   });
   ```

---

## Rollback Instructions

If issues arise, you can temporarily revert to direct Supabase queries by:

1. Restoring the previous version of `staff-dashboard.tsx`
2. Running RLS policy fixes: `scripts/fix_user_profiles_rls_simple.sql`
3. Verifying aircraft RLS policies allow staff access

However, the API approach is recommended for better reliability and maintainability.

---

## Additional Notes

- The `/api/clients` endpoint was already in place and working correctly
- The new `/api/aircraft` endpoint follows the same pattern as `/api/clients`
- Service role access is properly secured with role-based authorization
- All endpoints include proper CORS headers for production deployment
- Authentication is required for all endpoints (no anonymous access)

---

**Status:** ✅ All critical RLS issues resolved  
**Date:** November 14, 2025  
**Next Steps:** Monitor for any additional RLS-related issues and document them in `RLS_AUDIT_REPORT.md`

