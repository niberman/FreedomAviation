# RLS (Row Level Security) Audit Report
**Generated:** November 14, 2025  
**Purpose:** Identify all cases where client-side queries might be blocked by RLS policies

## Executive Summary

This audit identifies areas where client-side code makes direct Supabase queries that may be subject to RLS policies, and determines whether they should use API endpoints with service role access instead.

### Key Findings
- ✅ **FIXED:** Client dropdown in invoice creation (staff-dashboard.tsx) - now uses `/api/clients`
- ⚠️ **POTENTIAL ISSUE:** Aircraft queries in staff-dashboard for dropdown (line 134)
- ⚠️ **POTENTIAL ISSUE:** Service request inserts from owner components bypass API
- ✅ **GOOD:** Service requests fetch in staff-dashboard uses `/api/service-requests`
- ✅ **GOOD:** Clients table uses `/api/clients` endpoint

---

## 1. User Profiles / Clients (user_profiles table)

### API Endpoint Available
- **GET `/api/clients`** - Uses service role to bypass RLS
- **POST `/api/clients/create`** - Uses service role to create new clients

### Client-Side Queries

#### ✅ FIXED: staff-dashboard.tsx - Client dropdown for invoices
**Location:** `client/src/pages/staff-dashboard.tsx:79-111`
**Status:** ✅ **FIXED** - Now uses `/api/clients` endpoint
**Previous Issue:** Was querying `user_profiles` directly, blocked by RLS
**Fix Applied:** Changed to use `/api/clients` endpoint with service role

```typescript
// NOW CORRECT - Uses API endpoint
const { data: owners = [] } = useQuery({
  queryKey: ['/api/clients', session?.access_token],
  queryFn: async () => {
    const response = await fetch('/api/clients', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    // ...
  }
});
```

#### ✅ GOOD: clients-table.tsx
**Location:** `client/src/components/clients-table.tsx:56-85`
**Status:** ✅ Already using API endpoint correctly
**Uses:** `/api/clients` endpoint with service role access

```typescript
// CORRECT - Already uses API
const { data: clients = [] } = useQuery({
  queryKey: ['/api/clients', accessToken],
  queryFn: async () => {
    const response = await fetch('/api/clients', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    // ...
  }
});
```

#### ✅ ACCEPTABLE: owner-dashboard.tsx - User profile check
**Location:** `client/src/pages/owner-dashboard.tsx:30-44`
**Status:** ✅ Acceptable - querying own profile only
**Context:** Users can view their own profile via RLS policy

```typescript
// ACCEPTABLE - User viewing their own profile
const { data: userProfile } = useQuery({
  queryKey: ['user-profile', user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)  // Own ID only
      .maybeSingle();
    // ...
  }
});
```

---

## 2. Aircraft (aircraft table)

### API Endpoint Status
- ❌ **NO API ENDPOINT** for aircraft queries
- Aircraft queries rely on RLS policies

### Client-Side Queries

#### ⚠️ NEEDS REVIEW: staff-dashboard.tsx - Aircraft for invoice dropdown
**Location:** `client/src/pages/staff-dashboard.tsx:131-141`
**Status:** ⚠️ **POTENTIAL ISSUE** - Direct Supabase query
**Risk:** May be blocked if RLS policy prevents staff from viewing all aircraft

```typescript
// POTENTIALLY PROBLEMATIC - Direct query, depends on RLS
const { data: aircraft = [] } = useQuery({
  queryKey: ['/api/aircraft'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('aircraft')
      .select('id, tail_number, owner_id')
      .order('tail_number');
    if (error) throw error;
    return data;
  },
});
```

**Recommendation:** 
- Create `/api/aircraft` endpoint with service role access
- OR verify that RLS policies allow staff/admin to view all aircraft

#### ⚠️ NEEDS REVIEW: staff-dashboard.tsx - Full aircraft list
**Location:** `client/src/pages/staff-dashboard.tsx:144-292`
**Status:** ⚠️ **POTENTIAL ISSUE** - Direct Supabase query  
**Risk:** May fail if RLS blocks staff from viewing aircraft or owner details

```typescript
// POTENTIALLY PROBLEMATIC - Complex nested query
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
    // ...
  }
});
```

**Recommendation:**
- Create `/api/aircraft` endpoint that returns all aircraft with owner details
- Use service role to bypass RLS

#### ✅ ACCEPTABLE: useAircraft hook - Owner's own aircraft
**Location:** `client/src/lib/hooks/useAircraft.ts:47-62`
**Status:** ✅ Acceptable - owner viewing own aircraft
**Context:** RLS policy should allow owners to view their own aircraft

```typescript
// ACCEPTABLE - Owner viewing own aircraft
const aircraftList = useQuery({
  queryKey: ["aircraft", "list", user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("aircraft")
      .select("*")
      .eq("owner_id", user.id)  // Own aircraft only
      .order("tail_number");
    // ...
  }
});
```

#### ⚠️ NEEDS REVIEW: aircraft-table.tsx - Create aircraft
**Location:** `client/src/components/aircraft-table.tsx:339`
**Status:** ⚠️ **POTENTIAL ISSUE** - Direct insert
**Risk:** Staff creating aircraft for owners may be blocked

```typescript
// POTENTIALLY PROBLEMATIC - Staff creating aircraft for owners
const { error } = await supabase.from("aircraft").insert(payload);
```

**Recommendation:**
- Create `/api/aircraft` POST endpoint for staff to create aircraft
- Use service role to ensure proper access

---

## 3. Service Requests (service_requests table)

### API Endpoint Available
- **GET `/api/service-requests`** - Uses service role, requires staff/admin/cfi role
- **PATCH `/api/service-requests/:id`** - Uses service role to update status

### Client-Side Queries

#### ✅ GOOD: staff-dashboard.tsx - Fetch service requests
**Location:** `client/src/pages/staff-dashboard.tsx:308-346`
**Status:** ✅ Already using API endpoint correctly
**Uses:** `/api/service-requests` with authentication

```typescript
// CORRECT - Uses API endpoint
const { data: serviceRequests = [] } = useQuery({
  queryKey: ['/api/service-requests'],
  queryFn: async () => {
    const res = await authenticatedFetch('/api/service-requests');
    // ...
  }
});
```

#### ⚠️ NEEDS REVIEW: QuickActions.tsx - Create service requests
**Location:** `client/src/features/owner/components/QuickActions.tsx:170, 245, 340`
**Status:** ⚠️ **OWNER OPERATION** - Direct insert
**Context:** Owners creating service requests for their own aircraft
**Risk:** LOW - RLS should allow owners to insert their own service requests

```typescript
// ACCEPTABLE IF RLS ALLOWS - Owner creating own service request
const { data, error } = await supabase
  .from("service_requests")
  .insert(payload)
  .select();
```

**Recommendation:**
- Verify RLS policy allows owners to insert service requests for their own aircraft
- If issues arise, create `/api/service-requests` POST endpoint

#### ⚠️ SIMILAR PATTERNS IN:
- `client/src/components/prepare-aircraft-sheet.tsx:76` - Owner inserting service request
- `client/src/components/request-service-sheet.tsx:73` - Owner inserting service request

#### ✅ ACCEPTABLE: useServiceRequests hook - Owner's requests
**Location:** `client/src/lib/hooks/useServiceRequests.ts:53-73`
**Status:** ✅ Acceptable - owner viewing own requests
**Context:** RLS should allow owners to view their own service requests

```typescript
// ACCEPTABLE - Owner viewing own service requests
const serviceRequests = useQuery({
  queryKey: ["service-requests", user?.id, aircraftId],
  queryFn: async () => {
    let query = supabase
      .from("service_requests")
      .select("*")
      .eq("user_id", user.id);  // Own requests only
    // ...
  }
});
```

#### ⚠️ NEEDS REVIEW: kanban-board.tsx - Update service request
**Location:** `client/src/components/kanban-board.tsx:85-88`
**Status:** ⚠️ **FALLBACK LOGIC** - Direct update if no onStatusChange handler
**Risk:** May be blocked if RLS prevents updates

```typescript
// POTENTIALLY PROBLEMATIC - Fallback direct update
const { error } = await supabase
  .from("service_requests")
  .update({ status: dbStatus })
  .eq("id", requestId);
```

**Note:** This is a fallback - staff-dashboard provides onStatusChange handler that uses API

---

## 4. Invoices (invoices table)

### API Endpoint Available
- **POST `/api/invoices/send-email`** - Sends invoice email

### Client-Side Queries

#### ✅ GOOD: staff-dashboard.tsx - Fetch invoices
**Location:** `client/src/pages/staff-dashboard.tsx:456-589`
**Status:** ✅ Uses direct Supabase query with proper RLS filtering
**Context:** Query filters by CFI ID or admin role, RLS should enforce proper access

```typescript
// ACCEPTABLE - Uses RLS policies to filter results
const { data: invoices = [] } = useQuery({
  queryKey: ['/api/cfi/invoices', user?.id, isDev, isAdmin],
  queryFn: async () => {
    let query = supabase
      .from('invoices')
      .select(`...`)
      .eq('created_by_cfi_id', user.id);  // Filter by creator
    // ...
  }
});
```

**Recommendation:**
- Current approach is acceptable
- RLS policies should enforce proper access control
- Consider creating `/api/invoices` endpoint if issues arise

---

## 5. Other Tables

### Memberships & Service Credits

#### ✅ ACCEPTABLE: CreditsOverview.tsx
**Location:** `client/src/components/owner/CreditsOverview.tsx:10-46`
**Status:** ✅ Acceptable - owner viewing own data
**Context:** Queries filtered by user.id, RLS should allow

```typescript
// ACCEPTABLE - Owner viewing own membership and credits
const { data: membership } = useQuery({
  queryKey: ["membership", user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("memberships")
      .select(`...`)
      .eq("owner_id", user.id)  // Own data only
      .eq("is_active", true)
      .maybeSingle();
    // ...
  }
});
```

### Service Tasks

#### ✅ ACCEPTABLE: owner-more.tsx - Service tasks
**Location:** `client/src/pages/owner-more.tsx:98-133`
**Status:** ✅ Acceptable - owner viewing tasks for own aircraft
**Context:** Filtered by aircraft owned by user

```typescript
// ACCEPTABLE - Owner viewing service tasks for own aircraft
const { data: serviceTasks = [] } = useQuery({
  queryKey: ["service-tasks", aircraft?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("service_tasks")
      .select("*")
      .eq("aircraft_id", aircraft.id)  // Own aircraft
      // ...
  }
});
```

### Pricing Snapshots

#### ✅ ACCEPTABLE: useLatestSnapshot
**Location:** `client/src/features/pricing/hooks.ts:251-272`
**Status:** ✅ Acceptable - public pricing data
**Context:** Pricing snapshots should be publicly readable

```typescript
// ACCEPTABLE - Public pricing data
const { data, error } = await supabase
  .from('pricing_snapshots')
  .select('*')
  .order('published_at', { ascending: false })
  .limit(1)
  .single();
```

---

## Priority Action Items

### 🔴 HIGH PRIORITY

1. **Create `/api/aircraft` endpoint**
   - **Location:** `server/routes.ts`
   - **Purpose:** Allow staff to fetch all aircraft with owner details
   - **Use service role** to bypass RLS
   - **Used by:** staff-dashboard.tsx (2 queries)

2. **Verify Aircraft RLS Policies**
   - Check if staff/admin/cfi can view all aircraft
   - Check if staff can create aircraft for owners
   - If not, must use API endpoints

### 🟡 MEDIUM PRIORITY

3. **Review Service Request Insert Permissions**
   - Verify owners can insert service requests for their own aircraft
   - Test in all owner components:
     - QuickActions.tsx
     - prepare-aircraft-sheet.tsx
     - request-service-sheet.tsx
   - If blocked, create `/api/service-requests` POST endpoint

4. **Audit kanban-board.tsx Fallback Logic**
   - Ensure onStatusChange handler is always provided
   - Consider removing direct Supabase update fallback
   - Force use of API endpoint for status updates

### 🟢 LOW PRIORITY

5. **Consider Creating More API Endpoints**
   - `/api/invoices` - for CFI invoice queries
   - `/api/aircraft/:id` - for single aircraft details
   - Standardize on API-first approach for consistency

---

## RLS Policy Requirements

Based on this audit, verify these RLS policies exist and work correctly:

### user_profiles table
```sql
-- ✅ Exists: Users can view own profile
-- ✅ Exists: Staff/admin/founder/cfi can view all profiles (for client selection)
```

### aircraft table
```sql
-- ❓ VERIFY: Owners can view their own aircraft
-- ❓ VERIFY: Staff/admin/cfi can view all aircraft
-- ❓ VERIFY: Staff/admin can insert aircraft for any owner
-- ❓ VERIFY: Owners can insert their own aircraft
```

### service_requests table
```sql
-- ❓ VERIFY: Owners can insert requests for their own aircraft
-- ❓ VERIFY: Owners can view their own requests
-- ❓ VERIFY: Staff/admin/cfi can view all requests (handled by API)
-- ❓ VERIFY: Staff/admin/cfi can update any request (handled by API)
```

### invoices table
```sql
-- ❓ VERIFY: CFIs can view invoices they created
-- ❓ VERIFY: Admins can view all invoices
-- ❓ VERIFY: Owners can view invoices for their aircraft
```

---

## Recommended Next Steps

1. **✅ COMPLETED:** Fix client dropdown in staff-dashboard invoices
   - Changed to use `/api/clients` endpoint
   
2. **⏭️ NEXT:** Create `/api/aircraft` endpoint
   - Add GET endpoint with service role access
   - Update staff-dashboard.tsx to use it
   - Add POST endpoint for creating aircraft
   
3. **⏭️ THEN:** Test all owner service request creations
   - Verify RLS allows inserts
   - Add error handling
   - Create API endpoint if needed
   
4. **⏭️ FINALLY:** Run comprehensive RLS policy verification
   - Test each policy with different roles
   - Document expected behavior
   - Update this report with findings

---

## Testing Checklist

### Staff Dashboard
- [x] Clients dropdown loads in invoice creation
- [ ] Aircraft dropdown loads in invoice creation
- [ ] Aircraft table shows all aircraft with owner details
- [ ] Service requests Kanban board loads
- [ ] Can update service request status

### Owner Dashboard
- [ ] Can view own aircraft
- [ ] Can create service requests
- [ ] Can view own service requests
- [ ] Can view own invoices
- [ ] Can view membership and credits

### Admin Operations
- [ ] Can create clients
- [ ] Can create aircraft for owners
- [ ] Can view all service requests
- [ ] Can view all invoices

---

## Files Modified in This Audit

- ✅ `client/src/pages/staff-dashboard.tsx` - Fixed client dropdown (lines 78-111)

## Files That Need Attention

- ⚠️ `client/src/pages/staff-dashboard.tsx` - Aircraft queries (lines 131-292)
- ⚠️ `client/src/components/aircraft-table.tsx` - Aircraft insert (line 339)
- ⚠️ `client/src/features/owner/components/QuickActions.tsx` - Service request inserts
- ⚠️ `client/src/components/prepare-aircraft-sheet.tsx` - Service request insert
- ⚠️ `client/src/components/request-service-sheet.tsx` - Service request insert
- ⚠️ `client/src/components/kanban-board.tsx` - Service request update fallback

---

**Report End**

