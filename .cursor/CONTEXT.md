# Codebase context: API and data fetching

This file describes how the app talks to the backend and how to keep API usage consistent. Use it when adding or changing API calls or React Query usage.

---

## 1. API and data-fetching overview

- **All authenticated requests** to app API routes go through **`src/lib/api-client.ts`**:
  - **`apiJson<T>(url, options?)`** – authenticated GET/POST/PATCH etc., returns parsed JSON; on non-ok response throws a single `Error` with a consistent message.
  - **`apiFetch(url, options?)`** – same auth, returns raw `Response` when you need it (e.g. non-JSON or custom handling).

- **Auth (client):**
  - Bearer token comes from the Supabase session.
  - Token refresh and a single 401-retry are implemented in **`lib/auth-utils.ts`** (`getValidAuthToken`, `authenticatedFetch`). **`api-client`** uses `authenticatedFetch` and does not duplicate token logic.

- **Auth (server):**
  - API route handlers use **`lib/api-auth.ts`**:
    - **`getAuthenticatedUser(request)`** – validates Bearer token, returns user + profile or null.
    - **`requireRole(request, allowedRoles)`** – same validation and returns 401/403/503 with a message if not allowed.
  - All these routes expect **Bearer token** in the `Authorization` header; there is no cookie-based auth for these API routes.

---

## 2. API routes and who calls them

| Route | Methods | Called by (app) | Notes |
|-------|--------|------------------|-------|
| `/api/aircraft` | GET | `useAircraft.useStaffAircraftList`, staff aircraft table | Staff list; owner list uses Supabase in queryFn. |
| `/api/clients` | GET, POST | `useClients`, `ClientsTable` (staff) | Create client = POST to this route (not `/api/clients/create`). |
| `/api/service-requests` | GET | `useServiceRequests.useStaffServiceRequests` | |
| `/api/service-requests/[id]` | PATCH | `useServiceRequests.updateStatusMutation` | Update status. |
| `/api/staff/create` | POST | `StaffManagement` | Create staff member. |
| `/api/invoices/send-email` | POST | `useResendInvoice` | Resend invoice email. |
| `/api/onboarding/send-quote-email` | POST | `QuoteStep` (onboarding) | |
| `/api/onboarding/welcome-email` | POST | `onboarding-page` | |
| `/api/stripe/create-checkout-session` | POST | `lib/stripe.createCheckoutSession` (used by BillingCard) | Same auth as above (Bearer). |
| `/api/stripe/webhook` | POST | **Stripe only** (external) | Not called by the app; Stripe sends events here. |

**Google Calendar** (`/api/google-calendar/*`): Routes exist (auth-url, callback, calendars, disconnect, select-calendar, status, sync-all, sync-slot, toggle-sync) but are **not used by the current UI**. The callback may be used by an OAuth redirect if calendar linking is wired later.

---

## 3. Query key convention

- **`queryKey` starting with `['/api/...']`**  
  Data is loaded via an HTTP call to that (or a related) API route. Example: `['/api/clients']`, `['/api/aircraft']`, `['/api/service-requests']`.

- **`queryKey` without an `/api` prefix**  
  Data is from **Supabase** in the `queryFn` (or demo/local state). Examples:
  - `['maintenance']` – maintenance table (Supabase).
  - `['owners']` – owner list for staff (Supabase `user_profiles`).
  - `['cfi-invoices']` – invoices in `useInvoices` (Supabase).
  - `['aircraft', 'owner-list', userId]` – owner’s aircraft list (Supabase or demo).
  - `['client-details', clientId]` – client detail view (Supabase).
  - `['aircraft', 'full']` – used for invalidation only; no dedicated route.

When adding new features, use the same convention so invalidation and “where does this data come from?” stay clear.

---

## 4. Where things live

| Concern | Location |
|--------|----------|
| API route handlers | `src/app/api/**` |
| Client auth (session, provider) | `lib/auth-context.tsx` |
| Token + authenticated fetch | `lib/auth-utils.ts` |
| API client (apiJson / apiFetch) | `lib/api-client.ts` |
| Server-side auth (Bearer, roles) | `lib/api-auth.ts` |
| Data hooks (examples) | `hooks/useClients.ts`, `hooks/useAircraft.ts`, `hooks/useServiceRequests.ts`, `hooks/useInvoices.ts`, `hooks/useResendInvoice.ts` |
| Stripe (create-checkout-session) | `lib/stripe.ts` |
| Stripe webhook handler | `app/api/stripe/webhook/route.ts` |

---

## 5. Error handling

All errors from API calls that go through **`apiJson`** are normalized: on non-ok response, the body is parsed once and a single `Error` is thrown with `message` (or `error`) from the JSON, or a fallback. Callers do not need to parse response bodies for errors; they can rely on `error.message` and toasts.
