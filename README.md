# Freedom Aviation

Premium aircraft management and flight instruction at Centennial Airport (KAPA), Colorado. This document describes the entire application so you can understand, run, and rebuild it.

---

## Table of Contents

- [Product overview](#product-overview)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Directory structure](#directory-structure)
- [Environment variables](#environment-variables)
- [Authentication & authorization](#authentication--authorization)
- [API reference](#api-reference)
- [Client-side API usage](#client-side-api-usage)
- [Database (Supabase)](#database-supabase)
- [Key features & user flows](#key-features--user-flows)
- [Hooks & data layer](#hooks--data-layer)
- [Build, test & deploy](#build-test--deploy)
- [How to run & replicate](#how-to-run--replicate)

---

## Product overview

- **Owners**: Manage aircraft, view memberships, submit service/instruction requests, view and pay invoices, see billing and docs.
- **Staff / CFIs / Admins**: Staff dashboard (console) with clients, aircraft, service requests (kanban), invoices (create, edit, resend, unsend, delete), maintenance, operations, ramp, Google Calendar sync for CFI availability.
- **Marketing**: Home, about, pricing (configurator), contact, hangars. Onboarding flow (welcome → personal info → aircraft → membership quote → quote email).
- **Auth**: Email/password and optional OAuth via Supabase Auth. Roles: `owner`, `staff`, `cfi`, `admin`, `ops`, `founder`.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI | shadcn/ui + Radix UI, Lucide icons |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (session + Bearer token) |
| Payments | Stripe (Checkout, webhooks) |
| Email | Resend (invoices, quotes, welcome, staff invite) |
| State / server state | TanStack Query (React Query) |
| Deployment | Vercel |
| Testing | Vitest, Testing Library |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser (React)                                                         │
│  - App Router pages: (auth), (dashboard), (staff), (marketing)           │
│  - TanStack Query + hooks (useClients, useInvoices, useServiceRequests…) │
│  - apiJson() / authenticatedFetch() → Next.js API routes                │
│  - Supabase client (anon key) for direct DB: RLS, realtime, RPCs        │
└─────────────────────────────────────────────────────────────────────────┘
         │                                    │
         │ Bearer token                        │ Anon key + RLS
         ▼                                    ▼
┌──────────────────────┐            ┌──────────────────────────────────────┐
│  Next.js API routes  │            │  Supabase (PostgreSQL + Auth)         │
│  - requireRole() or  │            │  - user_profiles.role                │
│    getAuthenticated  │            │  - Tables: invoices, aircraft,       │
│  - createAdminClient │            │    service_requests, user_profiles…   │
│  - Stripe, Resend    │            │  - RPCs: create_instruction_invoice,  │
│  - Webhook (no auth) │            │    create_maintenance_invoice          │
└──────────────────────┘            │  - Storage: aircraft-documents       │
         │                          └──────────────────────────────────────┘
         │ Stripe webhook (signature)
         ▼
┌──────────────────────┐   Resend   ┌──────────────────────┐
│  Stripe              │◄─────────►│  Resend (email)      │
│  Checkout, webhooks  │            │  Invoice, quote,     │
│  Invoice paid → DB   │            │  welcome, invite     │
└──────────────────────┘            └──────────────────────┘
```

- **Frontend** talks to Supabase (client) for auth, RLS-protected tables, and RPCs; and to Next.js API routes for role-gated actions that need server-side Stripe/Resend or admin Supabase.
- **API routes** validate Bearer token (and often role via `user_profiles`), then use `createAdminClient()` (service role) and/or Stripe/Resend.
- **Stripe webhook** is the only route that does not use Bearer auth; it uses `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`.

---

## Directory structure

```
FreedomAviation-1/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes (no layout)
│   │   │   ├── login/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/              # Owner dashboard
│   │   │   └── dashboard/
│   │   │       ├── page.tsx          # Owner home
│   │   │       ├── aircraft/page.tsx
│   │   │       ├── members/page.tsx
│   │   │       ├── more/page.tsx     # Billing, service timeline, quick actions
│   │   │       └── settings/page.tsx
│   │   ├── (staff)/                  # Staff area (layout: staff nav)
│   │   │   └── staff/
│   │   │       ├── page.tsx          # Staff home (invoices, requests, quick invoice)
│   │   │       ├── console/page.tsx  # Staff dashboard wrapper
│   │   │       ├── aircraft/page.tsx
│   │   │       ├── members/page.tsx
│   │   │       ├── manage/page.tsx   # Clients + service requests
│   │   │       ├── operations/page.tsx
│   │   │       ├── ramp/page.tsx
│   │   │       └── settings/page.tsx
│   │   ├── (marketing)/
│   │   │   ├── page.tsx              # Home
│   │   │   ├── about/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── hangars/page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   └── demo/page.tsx
│   │   └── api/                      # API routes (see API reference)
│   │       ├── aircraft/route.ts
│   │       ├── clients/route.ts
│   │       ├── google-calendar/      # auth-url, callback, calendars, disconnect,
│   │       │                         # select-calendar, status, sync-all, sync-slot, toggle-sync
│   │       ├── invoices/send-email/route.ts
│   │       ├── onboarding/send-quote-email/route.ts
│   │       ├── onboarding/welcome-email/route.ts
│   │       ├── service-requests/route.ts
│   │       ├── service-requests/[id]/route.ts
│   │       ├── staff/create/route.ts
│   │       ├── stripe/create-checkout-session/route.ts
│   │       └── stripe/webhook/route.ts
│   ├── components/
│   │   ├── pages/                    # Page-level components (staff-home-page, owner-dashboard-page, etc.)
│   │   ├── staff/                    # Staff-only UI (kanban, clients-table, aircraft-table, etc.)
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── onboarding/              # Onboarding steps
│   │   └── auth/
│   ├── features/owner/               # Owner feature components (BillingCard, PasswordChangeCard, etc.)
│   ├── hooks/                        # useClients, useInvoices, useResendInvoice, useServiceRequests,
│   │                                 # useOwnerMore, useAircraft, useUserProfile, usePricing, use-toast
│   └── lib/                          # Core utilities
│       ├── api-auth.ts               # getAuthenticatedUser, requireRole
│       ├── api-client.ts             # apiJson, apiFetch (authenticatedFetch wrapper)
│       ├── auth-utils.ts            # getValidAuthToken, authenticatedFetch (Bearer + 401 retry)
│       ├── supabase.ts              # Browser Supabase client (anon)
│       ├── supabase-server.ts       # createAdminClient, createAnonClient
│       ├── roles.ts                 # API_ROLES, STAFF_ROLES, canCreateInvoices, etc.
│       ├── google-calendar.ts       # Google Calendar OAuth + API
│       ├── stripe-utils.ts
│       ├── welcome-email.ts
│       └── ...
├── shared/
│   └── database-types.ts            # UserRole, UserProfile, Aircraft, Invoice, etc.
├── supabase/
│   ├── config.toml
│   └── migrations/                  # SQL migrations (tables, RLS, RPCs)
├── public/
├── env.local.example
├── vercel.json
├── next.config.js
├── tailwind.config.ts
├── package.json
└── README.md (this file)
```

---

## Environment variables

Copy `env.local.example` to `.env.local` and set the following. Replace any placeholder values (e.g. `replace-with-your-service-role-key`). For production (e.g. Vercel), set the same keys in the project environment.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key for client-side auth and RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only; bypasses RLS) |
| `SUPABASE_URL` | Server | Same as `NEXT_PUBLIC_SUPABASE_URL` (used by API routes) |
| `SUPABASE_ANON_KEY` | Server | Same as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (used for token verification) |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key (e.g. `sk_...`) |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | Stripe webhook signing secret (e.g. `whsec_...`) |
| `RESEND_API_KEY` | For email | Resend API key (e.g. `re_...`) |
| `EMAIL_SERVICE` | Optional | Set to `resend` to send real email; default `console` logs only |
| `EMAIL_FROM` | Optional | From address (e.g. `Freedom Aviation <onboarding@resend.dev>`) |
| `FRONTEND_URL` or `SITE_URL` | Optional | App base URL for Stripe redirects and links (e.g. `https://www.freedomaviationco.com`) |
| `NEXT_PUBLIC_APP_URL` | Optional | Same; used as fallback in some API routes |
| `GOOGLE_CLIENT_ID` | For Calendar | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Calendar | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | For Calendar | OAuth redirect (e.g. `http://localhost:3000/api/google-calendar/callback`) |

---

## Authentication & authorization

- **Auth provider**: Supabase Auth. Login/signup (email/password) and optional OAuth. Session is stored in the client; access token is sent as `Authorization: Bearer <access_token>` to API routes.
- **Token usage**: `lib/auth-utils.ts` exposes `getValidAuthToken()` (from `supabase.auth.getSession()` with refresh) and `authenticatedFetch(url, options)` which adds `Authorization: Bearer <token>` and retries once on 401 after refresh.
- **Role source**: After validating the Bearer token, API routes that need role call `getAuthenticatedUser(request)` or `requireRole(request, allowedRoles)`. Role is read from `user_profiles.role` (table keyed by `auth.uid()`).
- **Role definitions** (`lib/roles.ts`):
  - `STAFF_ROLES`: `['admin','staff','cfi','ops','founder']`
  - `API_ROLES.ALL_STAFF`: staff + admin + founder + cfi + ops
  - `API_ROLES.MANAGE_CLIENTS`: admin, founder, ops
  - `API_ROLES.VIEW_CLIENTS`: admin, cfi, founder, ops
  - `API_ROLES.MANAGE_STAFF`: admin, founder
  - `API_ROLES.CALENDAR`: admin, cfi, founder
  - `API_ROLES.INVOICING`: admin, founder, cfi, ops
- **Protected routes**: Staff pages live under `(staff)/` and are wrapped with layout/guards that ensure the user has a staff role; owner dashboard under `(dashboard)/` for authenticated owners.

---

## API reference

All routes under `src/app/api/`. Unless noted, **auth** is Bearer token; **role** is enforced with `requireRole(request, [...API_ROLES.XXX])`.

| Method | Path | Auth / role | Body / params | Purpose |
|--------|------|-------------|---------------|---------|
| GET    | `/api/aircraft` | requireRole ALL_STAFF | - | List aircraft for staff (admin client) |
| GET    | `/api/clients` | requireRole VIEW_CLIENTS | - | List clients (owner profiles + optional aircraft) |
| POST   | `/api/clients` | requireRole MANAGE_CLIENTS | JSON: invite payload | Create/invite client (e.g. staff create) |
| GET    | `/api/google-calendar/auth-url` | requireRole CALENDAR | - | Return Google OAuth URL for Calendar |
| GET    | `/api/google-calendar/callback` | None (OAuth redirect) | Query: code, state | Exchange code for tokens; store in DB; redirect to staff |
| GET    | `/api/google-calendar/calendars` | requireRole CALENDAR | - | List user's Google calendars |
| POST   | `/api/google-calendar/disconnect` | requireRole CALENDAR | - | Disconnect Calendar for user |
| POST   | `/api/google-calendar/select-calendar` | requireRole CALENDAR | JSON: calendarId | Set default calendar for sync |
| GET    | `/api/google-calendar/status` | requireRole CALENDAR | - | Sync status (enabled, last sync, etc.) |
| POST   | `/api/google-calendar/sync-all` | requireRole CALENDAR | - | Trigger full sync of CFI schedule to Google |
| POST   | `/api/google-calendar/sync-slot` | requireRole CALENDAR | JSON: slot payload | Sync a single slot |
| POST   | `/api/google-calendar/toggle-sync` | requireRole CALENDAR | JSON: enable | Enable/disable sync |
| POST   | `/api/invoices/send-email` | requireRole INVOICING | JSON: `{ invoiceId }` | Load invoice, create Stripe Checkout if needed, send invoice email via Resend, set status sent |
| POST   | `/api/onboarding/send-quote-email` | None | JSON: toEmail, memberName, tierName, amounts, aircraft… | Send membership quote email (Resend or console) |
| POST   | `/api/onboarding/welcome-email` | getAuthenticatedUser (any) | - | Send welcome email after onboarding |
| GET    | `/api/service-requests` | requireRole ALL_STAFF | - | List service requests (admin client) |
| PATCH  | `/api/service-requests/[id]` | requireRole ALL_STAFF | JSON: status, etc. | Update one service request |
| POST   | `/api/staff/create` | requireRole MANAGE_STAFF | JSON: staff payload | Create staff user + optional invite email |
| POST   | `/api/stripe/create-checkout-session` | getAuthenticatedUser | JSON: `{ invoiceId }` | Create Stripe Checkout session for invoice; return URL |
| POST   | `/api/stripe/webhook` | None (Stripe signature) | Raw body (Stripe event) | Handle `checkout.session.completed` etc.; update invoice paid_date, status |

---

## Client-side API usage

- **Pattern**: Use `apiJson<T>(url, { method, body })` or `apiFetch(url, options)` from `lib/api-client.ts`. Both use `authenticatedFetch` (adds Bearer, retries on 401).
- **Where used**:
  - `useClients.ts`: `GET /api/clients`, `POST /api/clients` (invite).
  - `useResendInvoice.ts`: `POST /api/invoices/send-email` with `{ invoiceId }`.
  - `useServiceRequests.ts`: `GET /api/service-requests`, `PATCH /api/service-requests/[id]`.
  - `useAircraft.ts`: `GET /api/aircraft`.
  - `lib/stripe.ts`: `POST /api/stripe/create-checkout-session` with `{ invoiceId }`.
  - `clients-table.tsx`: same as useClients + resend invoice.
- **Onboarding**: Quote step calls `POST /api/onboarding/send-quote-email` with `fetch` (no auth). Welcome email is triggered by a call to `POST /api/onboarding/welcome-email` (authenticated).

---

## Database (Supabase)

- **Schema**: Defined in `supabase/migrations/` and reflected in `supabase-schema.sql`. Row Level Security (RLS) is enabled on tables; policies restrict access by `auth.uid()` and `user_profiles.role`.
- **Main tables**: `user_profiles`, `aircraft`, `invoices`, `invoice_lines`, `service_requests`, `service_tasks`, `maintenance`, `flight_logs`, `fuel_records`, `cfi_schedule`, `google_calendar_tokens`, `hangar_spaces`, `hangar_reservations`, `memberships`, `membership_tiers`, `membership_quotes`, `onboarding_data`, `notifications`, `pricing_*`, `aircraft_documents`, etc.
- **RPCs used by the app**:
  - `create_instruction_invoice(p_owner_id, p_aircraft_id, p_description, p_hours, p_rate_cents, p_cfi_id)` → returns invoice UUID. Creates invoice (with generated `invoice_number`) and one line; status `draft`, due in 30 days. Caller must be staff/cfi/admin/founder.
  - `create_maintenance_invoice(p_owner_id, p_aircraft_id, p_notes, p_line_items, p_created_by)` → returns invoice UUID. Same idea for maintenance; line items are JSONB.
  - `finalize_invoice(p_invoice_id)` → finalize draft invoice.
- **Storage**: Bucket `aircraft-documents` for uploads; path pattern `{aircraft_id}/{documentType}_{timestamp}.{ext}`.
- **Detailed table/RPC/storage map**: See [SUPABASE_USAGE_MAP.md](SUPABASE_USAGE_MAP.md) for every table, column/select pattern, RPC, and storage bucket with file locations.

---

## Key features & user flows

- **Owner signup → onboarding**: Welcome step → personal info → aircraft info → membership step (pricing) → quote step (send quote email) → complete; optional welcome email.
- **Owner dashboard**: Aircraft list, members/membership, “More” (billing/invoices, service timeline, quick actions), settings (e.g. password change). Invoices paid via Stripe Checkout (link from BillingCard or email).
- **Staff console**: Single entry at `/staff` (staff-home-page: invoices tab with create/edit/resend/unsend/delete, service requests, quick invoice form). Other tabs: clients, aircraft, operations, ramp, settings. Service requests shown in kanban; status updated via PATCH to `/api/service-requests/[id]`.
- **Invoice creation**: Staff creates instruction invoice via `supabase.rpc('create_instruction_invoice', …)` then updates the new row to `status: 'sent'` and `due_date` (14 days). No email is sent until “Resend” is clicked, which calls `POST /api/invoices/send-email`.
- **Invoice email**: `/api/invoices/send-email` loads invoice (admin client), ensures status is `sent` or `finalized`, gets owner email from `user_profiles`, creates or reuses Stripe Checkout session, sends HTML email via Resend with payment link, updates invoice status to `sent`.
- **Stripe payment**: Owner opens Checkout link; on success Stripe sends `checkout.session.completed` to `/api/stripe/webhook`; webhook updates `invoices.paid_date` and `invoices.status = 'paid'`.
- **Google Calendar**: Staff (CFI) connects Calendar via OAuth (`/api/google-calendar/auth-url` → Google → `/api/google-calendar/callback`); tokens stored in `google_calendar_tokens`. Sync pushes `cfi_schedule` slots to selected calendar.

---

## Hooks & data layer

| Hook | Purpose |
|------|---------|
| `useClients` | Fetch clients (GET /api/clients); used by staff dashboard and clients table |
| `useInvoices` | Fetch invoices (Supabase: instruction + maintenance), update invoice, create (RPC + update) |
| `useResendInvoice` | POST /api/invoices/send-email; invalidates cfi-invoices, cockpit-ledger, cockpit-stats |
| `useServiceRequests` | GET /api/service-requests, PATCH /api/service-requests/[id] |
| `useAircraft` | GET /api/aircraft (staff list); or Supabase for owner aircraft |
| `useOwnerMore` | Owner “More” page: service requests, invoices (Supabase), stats |
| `useUserProfile` | Current user profile (Supabase `user_profiles`); role, canSeeAllInvoices, etc. |
| `usePricing` | Pricing config (pricing_classes, pricing_locations, settings_pricing_assumptions, etc.) |
| `use-toast` | Toast notifications (UI state) |

TanStack Query keys used for cache invalidation include: `cfi-invoices`, `cockpit-ledger`, `cockpit-stats`, `service-requests`, and per-hook keys.

---

## Build, test & deploy

- **Scripts** (`package.json`): `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run check` (TypeScript), `npm run test` / `npm run test:watch` / `npm run test:ui` / `npm run test:coverage` (Vitest).
- **Vercel**: `vercel.json` sets framework `nextjs`, buildCommand `npm run build`, installCommand `npm install`. Connect repo to Vercel; set env vars; production URL can be set to `www.freedomaviationco.com`. Middleware redirects production non-www to www (and allows `vercel.app` previews).
- **Supabase**: Migrations in `supabase/migrations/`. Use Supabase CLI: `supabase link`, `supabase db push` (or deploy migrations via dashboard). Local: `supabase start` (Docker required).
- **Stripe webhook**: In Stripe Dashboard, add endpoint `https://<your-domain>/api/stripe/webhook` for `checkout.session.completed` (and any other events you use); set `STRIPE_WEBHOOK_SECRET` to the signing secret.

---

## How to run & replicate

1. **Clone and install**
   - `git clone <repo> && cd FreedomAviation-1 && npm install`
2. **Environment**
   - `cp env.local.example .env.local` and fill Supabase URL/keys, Stripe keys, Resend (and optionally Google OAuth). Set `EMAIL_SERVICE=resend` to send real emails.
3. **Supabase**
   - Create a project at supabase.com; run migrations from `supabase/migrations/` (or `supabase db push`). Create `user_profiles` rows for test users and set `role` (e.g. `owner`, `staff`, `founder`).
4. **Stripe**
   - Create products/prices if needed; for invoice payment the app creates Checkout sessions with line items from invoice. Set webhook to `https://<ngrok or host>/api/stripe/webhook` for local testing.
5. **Run**
   - `npm run dev` → open `http://localhost:3000`. Log in as owner or staff; staff area at `/staff`, owner dashboard at `/dashboard`.
6. **Rebuilding from this README**
   - Use the same stack (Next.js 16, Supabase, Stripe, Resend). Implement auth with Supabase Auth and `user_profiles.role`; protect API routes with Bearer token and `requireRole`; use `createAdminClient()` only on the server. Recreate tables and RLS from migrations; implement RPCs `create_instruction_invoice` and `create_maintenance_invoice` that set `invoice_number`. Use `apiJson`/`authenticatedFetch` for all authenticated app→API calls; use Stripe webhook for payment completion and Resend for all transactional email. Match env vars and role names so behavior matches.

---

## License

MIT. See [LICENSE](LICENSE) for details.
