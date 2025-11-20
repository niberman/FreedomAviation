# Freedom Aviation - Complete Context for Cursor AI

**Last Updated**: November 20, 2025  
**Purpose**: Master reference document for AI assistants working on this codebase  
**Status**: ✅ Production - Actively Maintained

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [User System & Authentication](#user-system--authentication)
3. [Database Architecture](#database-architecture)
4. [Known Issues & Constraints](#known-issues--constraints)
5. [Recent Changes & Migrations](#recent-changes--migrations)
6. [Email & Communication](#email--communication)
7. [Development Workflow](#development-workflow)
8. [Critical Dependencies](#critical-dependencies)

---

## System Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: Wouter (lightweight React router)
- **Backend**: Express.js + TypeScript (Node.js 20+)
- **Database**: Supabase (PostgreSQL 15+)
- **Auth**: Supabase Auth (with Google OAuth support)
- **State Management**: TanStack Query (React Query)
- **Payments**: Stripe + Stripe Checkout
- **Email**: Resend (via SMTP through Supabase)
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS
- **Hosting**: Vercel (serverless functions)
- **Testing**: Vitest + Testing Library

### Project Structure
```
/client/           - React frontend application
  /src/
    /pages/        - Route pages (home, dashboard, staff, admin)
    /components/   - Reusable UI components + shadcn/ui
    /features/     - Feature-specific components
    /lib/          - Utilities, hooks, and configurations
    /seo/          - SEO utilities and keywords
/server/           - Express backend server
  /routes/         - API route handlers
  /lib/            - Server utilities (email, calendar, etc.)
/shared/           - Shared TypeScript types/schemas
  schema.ts        - Legacy Drizzle schema (incomplete)
  database-types.ts - Complete TypeScript types for all tables
  supabase-types.ts - Supabase-specific types
/migrations/       - Database migration scripts (43 files)
/scripts/          - Utility SQL scripts (21 files)
/docs/             - Complete documentation
  /architecture/   - Database schema documentation
  /features/       - Feature-specific docs
  /development/    - Development guides
  /setup/          - Setup and configuration guides
/public/           - Static assets (images, videos, PWA files)
/attached_assets/  - Project assets and attachments
```

---

## Implemented Features

### Core Features (Production)
1. **Aircraft Management**
   - Aircraft registration and tracking
   - Hobbs/Tach hour tracking
   - Aircraft features (TKS, Oxygen) for class determination
   - Aircraft images and documentation
   - Fuel tracking (usable and tabs fuel capacity)
   - Status management (active, maintenance, inactive)

2. **Service Request System**
   - Pre-flight concierge requests
   - Maintenance coordination
   - Fuel orders
   - Hangar pullout scheduling
   - O2/TKS top-off requests
   - GPU and cabin provisioning
   - Priority-based workflow (low, medium, high)
   - Status tracking (pending, in_progress, completed, cancelled)

3. **Maintenance Tracking**
   - Calendar-based maintenance items
   - Hobbs-based maintenance tracking
   - Tach-based maintenance tracking
   - Status monitoring (current, due_soon, overdue)
   - Maintenance notes and completion tracking

4. **Flight Logs**
   - Flight hour logging
   - Pilot tracking
   - Aircraft usage history
   - Date/time tracking

5. **Membership Management**
   - Three-tier membership system (Class I, II, III)
   - Monthly credit allocation
   - Credit usage tracking
   - Membership status (active/inactive)
   - Start/end date management

6. **Invoicing & Billing**
   - Invoice generation (draft, finalized, paid, void)
   - Line item tracking
   - Stripe Checkout integration
   - Payment processing
   - Invoice history
   - Category-based invoicing (service, instruction, etc.)

7. **User Roles & Access Control**
   - Owner role (default) - access own data
   - CFI role - instructor capabilities
   - Staff role - operations access
   - Ops role - operations manager
   - Admin role - system administrator
   - Founder role - super admin with config access
   - Row Level Security (RLS) policies for all tables

8. **Staff/Admin Features**
   - Kanban board for service request management
   - Client management dashboard
   - Aircraft oversight
   - Pricing configurator
   - Staff management
   - Operations dashboard

9. **CFI (Flight Instructor) Features**
   - Schedule management
   - Google Calendar integration
   - Student/client tracking
   - Instruction request handling
   - Invoice creation for instruction

10. **Pricing System**
    - Multi-tier pricing structure
    - Hangar location-based pricing
    - Class-based pricing (I, II, III)
    - Hour band calculations
    - Assumptions management (labor rates, overhead, etc.)
    - Real-time pricing calculator
    - Margin calculation

11. **Email Notifications**
    - Service request notifications
    - Invoice notifications
    - Maintenance due alerts
    - Flight instruction notifications
    - Email queue system with retry logic
    - HTML and text email templates
    - Resend integration via Supabase SMTP

12. **Authentication & Security**
    - Supabase Auth integration
    - Email/password authentication
    - Google OAuth sign-in
    - Password reset flow
    - Protected routes
    - Role-based access control
    - Session management with cookies
    - Token refresh handling

13. **SEO & Marketing**
    - Local SEO optimization for Colorado market
    - Structured data (JSON-LD)
    - Sitemap generation
    - Meta tags and Open Graph
    - Keyword optimization
    - Performance optimization (Lighthouse 90+)

14. **Progressive Web App (PWA)**
    - Service worker
    - Web manifest
    - Offline capabilities
    - iOS install banner
    - App-like experience

### Routes

#### Public Routes
- `/` - Homepage with hero, features, testimonials
- `/pricing` - Pricing tiers and calculator
- `/hangars` - Hangar locations map
- `/contact` - Contact form
- `/about` - About page
- `/login` - Authentication (sign in/sign up)
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset confirmation

#### Protected Routes (Owner)
- `/dashboard` - Owner dashboard (aircraft overview)
- `/dashboard/aircraft` - Aircraft management
- `/dashboard/members` - Membership details
- `/dashboard/settings` - Account settings
- `/dashboard/more` - Additional settings and billing
- `/onboarding` - New user onboarding flow

#### Staff/Admin Routes
- `/staff` or `/admin` - Staff home dashboard
- `/staff/manage` or `/admin/manage` - Kanban board
- `/staff/members` - Client management
- `/staff/aircraft` - Aircraft oversight
- `/staff/operations` - Operations dashboard
- `/staff/settings` - Staff settings
- `/staff/pricing` or `/admin/pricing` - Pricing configurator

#### API Routes
- `/api/stripe/*` - Stripe payment webhooks and checkout
- `/api/google-calendar/*` - Google Calendar integration
- `/api/email-notifications/*` - Email notification processing
- `/api/invoice/*` - Invoice management

---

## User System & Authentication

### Architecture Overview

```
┌─────────────────┐
│  auth.users     │  ← Supabase Auth (Primary source)
│  (Supabase)     │
└────────┬────────┘
         │
         │ Trigger: handle_new_user
         ↓
┌─────────────────┐
│ user_profiles   │  ← Application user data
│  (public)       │
└────────┬────────┘
         │
         │ FK references
         ↓
┌─────────────────┐
│ invoices        │  ← owner_id references user_profiles.id
│ service_requests│  ← user_id references user_profiles.id
│ aircraft        │  ← owner_id references user_profiles.id
│ memberships     │  ← owner_id references user_profiles.id
│ ... many more   │
└─────────────────┘
```

### User Creation Flow

1. **Supabase Dashboard** → Add user (sends invite email)
2. **Trigger `handle_new_user`** → Auto-creates row in `user_profiles`
3. **Default role** assigned via `assign_default_role` trigger
4. **User receives email** via Resend SMTP
5. **User clicks link** → Sets password → Account active

### User Roles

**Enum**: `user_role` (stored in `user_profiles.role`)

| Role      | Description                          | Access Level |
|-----------|--------------------------------------|--------------|
| `owner`   | Aircraft owner/client (default)      | Own data     |
| `cfi`     | Certified Flight Instructor          | Students     |
| `staff`   | Operations staff                     | Most data    |
| `ops`     | Operations manager                   | Most data    |
| `admin`   | System administrator                 | All data     |
| `founder` | Company founder (super admin)        | All + config |

**IMPORTANT**: 
- ✅ Single source of truth: `user_profiles.role` (user_role enum)
- ❌ OLD SYSTEM (being removed): `user_roles` table with `app_role` enum
- 🔧 Migration in progress: `migrations/resolve_user_roles_duplication.sql`

### User Deletion Problem

**Issue**: Cannot delete users if they have related records

**Error Example**:
```
Unable to delete row ... referenced by invoices
```

**Reason**: FK constraints without CASCADE:
- `invoices.owner_id` → `user_profiles.id`
- `service_requests.user_id` → `user_profiles.id`
- `aircraft.owner_id` → `user_profiles.id`
- Many more...

**Solutions**:
1. **Soft delete**: Add `deleted_at` column, filter in queries
2. **Reassign ownership**: Transfer records to another user
3. **Add CASCADE**: Modify FKs (⚠️ dangerous - will delete all user data)
4. **Archive system**: Move to `archived_users` table

**Current Recommendation**: Implement soft delete system

---

## Database Architecture

### Core Tables

| Table                  | Purpose                              | Key Relationships |
|------------------------|--------------------------------------|-------------------|
| `user_profiles`        | User accounts & roles                | FK from many tables |
| `aircraft`             | Aircraft inventory                   | → user_profiles (owner) |
| `memberships`          | User memberships                     | → user_profiles, aircraft |
| `service_requests`     | Service orders                       | → user_profiles, aircraft |
| `invoices`             | Billing                              | → user_profiles, aircraft |
| `maintenance`          | Aircraft maintenance                 | → aircraft |
| `flight_logs`          | Flight history                       | → aircraft, user_profiles |
| `cfi_schedule`         | Instructor scheduling                | → user_profiles (cfi) |

### Database Views

**IMPORTANT**: These views must be updated when changing underlying columns

1. **`v_owner_aircraft`** 
   - Depends on: `aircraft` table
   - ⚠️ Currently depends on `hobbs_time`, `tach_time` (being migrated to `hobbs_hours`, `tach_hours`)
   - Used by: Owner dashboard

2. **`v_memberships`**
   - Joins: `memberships` + `membership_tiers`
   - Adds: `tier_name`, `base_price`

3. **`v_service_requests`**
   - Joins: `service_requests` + `aircraft` + `user_profiles`
   - Adds: `tail_number`, `requester_name`

### Triggers & Functions

#### Critical Triggers

1. **`handle_new_user`** (ON auth.users INSERT)
   ```sql
   -- Creates user_profiles row automatically
   -- Syncs email from auth.users to user_profiles
   ```

2. **`assign_default_role`** (ON user_profiles INSERT)
   ```sql
   -- Assigns default role 'owner' if not specified
   ```

3. **`update_updated_at_column`** (BEFORE UPDATE on many tables)
   ```sql
   -- Automatically updates updated_at timestamp
   ```

4. **Email notification triggers**
   - `on_invoice_created` → sends email
   - `on_maintenance_due` → sends email

### Row Level Security (RLS)

**Status**: ✅ Enabled on all public tables

**Common Patterns**:

```sql
-- Owners can see their own data
CREATE POLICY "owners_own_data" ON table_name
  FOR SELECT USING (owner_id = auth.uid());

-- Staff can see all data
CREATE POLICY "staff_see_all" ON table_name
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'founder')
    )
  );
```

**Known Issues**:
- ⚠️ Recursive policy checks can cause infinite loops
- ⚠️ `user_profiles` RLS has been fixed multiple times
- ✅ Current state: Stable after `migrations/fix_user_creation_trigger.sql`

### Schema Sync Status

**Last Validated**: November 14, 2025

**Status**: ✅ TypeScript types synchronized with database schema

**Documents**:
- `SCHEMA_SYNC_ISSUES.md` - Detailed issue analysis
- `SCHEMA_SYNC_ACTION_PLAN.md` - Implementation guide
- `SCHEMA_ANALYSIS_SUMMARY.md` - Executive summary

**Key Findings**:
- ✅ All 45+ tables have TypeScript interfaces
- ⚠️ 2 duplicate columns in `aircraft` (migration pending)
- ⚠️ Dual user role system (migration pending)
- ✅ 6 missing table interfaces added
- ✅ 3 database views documented

---

## Known Issues & Constraints

### 1. Aircraft Column Migration

**Issue**: Duplicate columns `hobbs_time`/`tach_time` and `hobbs_hours`/`tach_hours`

**Blocker**: View `v_owner_aircraft` depends on old column names

**Solution**: `migrations/cleanup_aircraft_duplicate_columns.sql`
- Updates view first
- Drops old columns with CASCADE
- Recreates view with aliases for backward compatibility

**Status**: 🔧 Migration script ready, needs testing

### 2. User Role System Duplication

**Issue**: Two systems for storing user roles
- `user_profiles.role` (user_role enum) ✅ CORRECT
- `user_roles` table (app_role enum) ❌ DEPRECATED

**Solution**: `migrations/resolve_user_roles_duplication.sql`
- Migrates data from `user_roles` → `user_profiles.role`
- Drops `user_roles` table
- Removes `app_role` enum

**Status**: 🔧 Migration script ready, needs testing

### 3. User Deletion Constraints

**Issue**: Cannot delete users with related records

**Affected Tables**:
- `invoices` (owner_id)
- `service_requests` (user_id)
- `aircraft` (owner_id)
- `memberships` (owner_id)
- `flight_logs` (pilot_id)
- Many more...

**Recommended Solution**: Implement soft delete
```sql
-- Add to user_profiles
ALTER TABLE user_profiles ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN deleted_by UUID REFERENCES user_profiles(id);
```

**Status**: ⏳ Not yet implemented

### 4. Membership Tier Ambiguity

**Issue**: `memberships` table has both:
- `tier` (TEXT) - stores tier name?
- `tier_id` (UUID) - FK to `membership_tiers`

**Question**: Which is authoritative?

**Status**: ⚠️ Needs product owner clarification

---

## Recent Changes & Migrations

### Completed (Nov 20, 2025)

1. ✅ **Authentication Fixes** (Not yet committed)
   - Fixed Supabase client configuration with proper auth options
   - Added cookie configuration for custom domain (www.freedomaviationco.com)
   - Removed automatic sign-out that caused 403 errors
   - Fixed SIGNED_OUT event handling
   - Fixed logout to use global scope with error handling
   - Added session refresh error handling
   - Removed hero image preload warning
   - Files changed: `client/src/lib/supabase.ts`, `client/src/lib/auth-context.tsx`, `client/src/lib/auth-utils.ts`, `client/index.html`
   - See: `DEPLOY_AUTH_FIXES.md` and `SUPABASE_AUTH_PRODUCTION_GUIDE.md`

### Completed (Nov 14, 2025)

1. ✅ **Schema Analysis**
   - Exported full schema from Supabase (2,764 rows)
   - Identified 8 critical mismatches
   - Updated TypeScript types (200+ lines)

2. ✅ **TypeScript Type Updates**
   - `shared/database-types.ts` - Added 9 interfaces, updated 3
   - `shared/supabase-types.ts` - Updated Aircraft, ServiceRequest
   - All changes compile with no errors

3. ✅ **Documentation**
   - Created comprehensive schema sync documentation
   - Created migration scripts with detailed logging
   - Added database view interfaces

### Pending Migrations

1. 🔧 **`migrations/cleanup_aircraft_duplicate_columns.sql`**
   - **Purpose**: Remove duplicate hobbs_time/tach_time columns
   - **Risk**: Low (data is migrated first)
   - **Dependencies**: Updates `v_owner_aircraft` view
   - **Status**: Ready for staging testing

2. 🔧 **`migrations/resolve_user_roles_duplication.sql`**
   - **Purpose**: Consolidate user role system
   - **Risk**: Medium (affects authentication)
   - **Dependencies**: RLS policies reference user_profiles.role
   - **Status**: Ready for staging testing

### Migration Execution Order

**IMPORTANT**: Run in this order on staging first!

```bash
# 1. Test on staging database first
# 2. Backup production before running

# Step 1: Aircraft columns
psql -f migrations/cleanup_aircraft_duplicate_columns.sql

# Step 2: User roles
psql -f migrations/resolve_user_roles_duplication.sql

# Step 3: Verify
npm run build  # Check TypeScript compilation
npm test       # Run test suite
```

---

## Email & Communication

### SMTP Configuration

**Provider**: Resend  
**Status**: ✅ Fully functional

**Configuration** (in Supabase Dashboard → Authentication → Email Templates):
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [API key from Resend]
Sender email: info@freedomaviationco.com
Sender name: Freedom Aviation
```

### Email Notification System

**Architecture**:
- Email notifications stored in `email_notifications` table
- Queue-based processing system
- Retry logic for failed sends
- Status tracking (pending, sent, failed)
- HTML and plain text templates

**Email Types Sent**:
1. **Auth Emails** (via Supabase Auth):
   - User invitation emails ✅
   - Password reset emails ✅
   - Email verification ✅

2. **Service Notifications** (via custom system):
   - Service request confirmations ✅
   - Service request status updates ✅
   - Flight instruction requests ✅

3. **Billing Notifications**:
   - Invoice created ✅
   - Invoice paid ✅
   - Payment reminders ✅

4. **Maintenance Alerts**:
   - Maintenance due soon ✅
   - Maintenance overdue ✅

**Email Templates**:
- `server/lib/service-request-email.ts` - Service request templates
- `server/lib/email.ts` - Invoice templates
- HTML and plain text versions for all emails

**Processing**:
```bash
# Email queue processor endpoint (protected by API key)
POST /api/email-notifications/process

# Email webhook for Supabase triggers
POST /api/email-notifications/webhook

# Manual processing via API
curl -X POST https://your-domain.com/api/email-notifications/process \
  -H "x-api-key: your-api-key"
```

**Envelope Sender**: `0100019a83ce3ede-...@send.freedomaviationco.com`
- This is **normal** - Resend uses SES-style message IDs
- Recipients see: `Freedom Aviation <info@freedomaviationco.com>`

**Logging**: All emails logged in:
1. Resend dashboard: https://resend.com/emails
2. Database `email_notifications` table
3. Server logs (console)

**Testing**:
```bash
# Check if emails are sending
# 1. Add user in Supabase dashboard
# 2. Check Resend logs: https://resend.com/emails
# 3. Check database: SELECT * FROM email_notifications WHERE status = 'pending';
# 4. Verify email received in inbox
```

---

## Integrations & External Services

### Google Calendar Integration

**Status**: ✅ Implemented for CFI scheduling

**Features**:
- Two-way calendar sync for CFI availability
- OAuth 2.0 authentication flow
- Event creation and updates
- Calendar reading for availability
- Token storage and refresh

**Configuration**:
```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google-calendar/callback
```

**Implementation**:
- `server/lib/google-calendar.ts` - Core calendar integration
- OAuth flow handled through `/api/google-calendar/*` endpoints
- Token stored in `user_profiles` or separate oauth table

**Usage**:
```typescript
// CFI connects their Google Calendar
// 1. User initiates OAuth flow
// 2. Redirects to Google consent screen
// 3. Callback stores refresh token
// 4. System syncs CFI availability to calendar
```

### Stripe Integration

**Status**: ✅ Production ready

**Features**:
- Stripe Checkout for invoice payments
- Webhook handling for payment events
- Customer creation and management
- Subscription tracking (stored in user_profiles)
- Payment status updates

**Configuration**:
```env
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Implementation**:
- `server/routes.ts` - Stripe routes and webhook handlers
- `client/src/features/owner/components/BillingCard.tsx` - Payment UI
- Invoice payment flow via Stripe Checkout
- Automatic invoice status updates on payment

**Webhook Events Handled**:
- `checkout.session.completed` - Mark invoice as paid
- `invoice.payment_succeeded` - Update payment status
- `customer.subscription.updated` - Update subscription status

### Resend Email Integration

**Status**: ✅ Production (via Supabase SMTP)

**Method**: Supabase Auth uses Resend for transactional emails

**Configuration** (in Supabase Dashboard):
- SMTP relay through Resend
- Custom domain: info@freedomaviationco.com
- Templates for auth emails in Supabase

**Custom Emails**: Application-triggered emails use direct Resend API or queue system

---

## Development Workflow

### Adding New Users

**Via Supabase Dashboard** (Preferred):
1. Go to Authentication → Users
2. Click "Add user"
3. Enter email
4. Click "Send invite"
5. ✅ Trigger creates user_profiles automatically
6. ✅ Email sent via Resend

**Via SQL** (Advanced):
```sql
-- Only if you need to bypass email
INSERT INTO auth.users (email, encrypted_password, ...)
VALUES (...);
-- Trigger will create user_profiles
```

### Deleting Users

**⚠️ CAUTION**: Users with related records cannot be deleted

**Check dependencies first**:
```sql
-- Check if user has invoices
SELECT COUNT(*) FROM invoices WHERE owner_id = 'user-id';

-- Check if user has aircraft
SELECT COUNT(*) FROM aircraft WHERE owner_id = 'user-id';

-- Check if user has service requests
SELECT COUNT(*) FROM service_requests WHERE user_id = 'user-id';
```

**Safe deletion** (if no dependencies):
```sql
-- 1. Delete from user_profiles (will cascade to auth.users)
DELETE FROM user_profiles WHERE id = 'user-id';
```

**Recommended**: Implement soft delete instead

### Modifying Schema

**When changing table columns**:

1. ✅ Check for dependent views:
   ```sql
   SELECT 
     v.table_schema,
     v.table_name AS view_name,
     d.refobjid::regclass AS depends_on
   FROM pg_views v
   JOIN pg_depend d ON d.objid = v.table_name::regclass
   WHERE d.refobjid::regclass::text LIKE '%table_name%';
   ```

2. ✅ Check for dependent RLS policies:
   ```sql
   SELECT * FROM pg_policies 
   WHERE definition ILIKE '%column_name%';
   ```

3. ✅ Update TypeScript types in `shared/database-types.ts`

4. ✅ Run TypeScript compiler: `npm run build`

5. ✅ Create migration script with proper error handling

6. ✅ Test on staging first!

---

## Critical Dependencies

### Foreign Key Relationships

**Cannot delete without handling**:

```
auth.users (1) ─┐
                ↓
user_profiles (1) ─┬─→ invoices (N)
                   ├─→ service_requests (N)
                   ├─→ aircraft (N)
                   ├─→ memberships (N)
                   ├─→ flight_logs (N)
                   ├─→ cfi_schedule (N)
                   └─→ instruction_requests (N)

aircraft (1) ─┬─→ service_requests (N)
              ├─→ maintenance (N)
              ├─→ flight_logs (N)
              └─→ invoices (N)
```

### View Dependencies

**Must update views when changing**:

```
aircraft.hobbs_time  ← v_owner_aircraft (depends on this column)
aircraft.tach_time   ← v_owner_aircraft (depends on this column)
```

### Trigger Dependencies

**Auto-executed on table changes**:

```
auth.users INSERT     → handle_new_user → creates user_profiles
user_profiles INSERT  → assign_default_role → sets default role
ANY UPDATE           → update_updated_at_column → updates timestamp
invoices INSERT      → on_invoice_created → sends email
```

---

## Quick Reference Commands

### Database Queries

```sql
-- Check user role
SELECT id, email, role FROM user_profiles WHERE email = 'user@example.com';

-- Check aircraft status
SELECT tail_number, hobbs_hours, tach_hours, status FROM aircraft;

-- Check view definition
\d+ v_owner_aircraft

-- Check trigger definition
\sf handle_new_user

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Check FK constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'user_profiles';
```

### TypeScript

```bash
# Check compilation
npm run build

# Run tests
npm test

# Start dev server
npm run dev

# Type check only
npx tsc --noEmit
```

---

## Troubleshooting Guide

### Problem: User creation fails

**Check**:
1. Is SMTP configured correctly?
2. Is Resend API key valid?
3. Does `handle_new_user` trigger exist?
4. Are RLS policies blocking?

**Debug**:
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if user_profiles was created
SELECT * FROM user_profiles WHERE email = 'test@example.com';
```

### Problem: Cannot delete user

**Reason**: FK constraints

**Solution**:
```sql
-- Find what's blocking
SELECT 
  tc.table_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN (
  SELECT ccu.table_name
  FROM information_schema.constraint_column_usage ccu
  WHERE ccu.column_name = 'id'
  AND ccu.table_name = 'user_profiles'
);
```

### Problem: Migration fails with "depends on"

**Reason**: Views or constraints depend on column

**Solution**:
1. Update/drop dependent views first
2. Use `CASCADE` (⚠️ careful!)
3. Recreate views after column change

### Problem: TypeScript errors after schema change

**Reason**: Types out of sync with database

**Solution**:
1. Update `shared/database-types.ts`
2. Update `shared/supabase-types.ts`
3. Run `npm run build` to check
4. Search codebase for old column references

---

## For AI Assistants (Cursor, etc.)

### Document Organization Policy

**⚠️ CRITICAL: Do NOT create new documentation files in the project root unless absolutely necessary!**

#### Allowed Root-Level Files
Only these files should exist in the project root:
- `README.md` - Project overview (keep updated)
- `CONTRIBUTING.md` - Contribution guidelines
- `CURSOR_CONTEXT.md` - AI assistant reference (this file)
- `LICENSE` - License file (if exists)

#### Where to Create New Documentation

**Authentication & Security**:
- Location: `docs/development/auth/`
- Examples: Auth guides, security fixes, OAuth configuration

**Development Guides**:
- Location: `docs/development/`
- Examples: Setup guides, deployment procedures, troubleshooting

**Features**:
- Location: `docs/features/`
- Examples: Feature documentation, integration guides, API references

**Database & Architecture**:
- Location: `docs/architecture/`
- Examples: Schema documentation, database migrations, system design

**Setup & Configuration**:
- Location: `docs/setup/`
- Examples: Email configuration, Stripe setup, environment variables

**Design Guidelines**:
- Location: `docs/design/`
- Examples: UI/UX guidelines, component patterns, branding

#### Before Creating a New Document

**Ask yourself**:
1. ❓ Does this information belong in an existing document?
2. ❓ Is this documentation absolutely necessary, or is it redundant?
3. ❓ Should this be a code comment instead?
4. ❓ Does the existing `docs/` structure already have a place for this?

**If you must create a new document**:
1. ✅ Choose the appropriate `docs/` subdirectory
2. ✅ Create a descriptive filename (kebab-case)
3. ✅ Add an entry to the parent directory's README
4. ✅ Update `docs/README.md` with a link
5. ✅ Cross-reference from `CURSOR_CONTEXT.md` if relevant

#### Cleanup Protocol

**If you find scattered documentation**:
1. Move it to the appropriate `docs/` subdirectory
2. Update all cross-references
3. Add a README in the target directory if missing
4. Verify no broken links

**Example of proper organization**:
```
✅ Good:
docs/development/auth/supabase-auth-guide.md
docs/features/google-calendar-integration.md
docs/setup/email-configuration.md

❌ Bad (don't do this):
SUPABASE_AUTH_GUIDE.md (root)
GOOGLE_CALENDAR_SETUP.md (root)
EMAIL_CONFIG.md (root)
NEW_FEATURE_DOCS.md (root)
```

---

### When Working With This Codebase

**Always**:
- ✅ Check `user_profiles.role` (not `user_roles` table)
- ✅ Be aware of FK constraints when deleting
- ✅ Update views when changing table columns
- ✅ Run migrations on staging first
- ✅ Update TypeScript types when changing schema
- ✅ Check for RLS policy impacts
- ✅ **Place new documentation in `docs/` subdirectories, NOT in root**
- ✅ **Check if documentation already exists before creating new files**
- ✅ **Update cross-references when moving/creating docs**

**Never**:
- ❌ Drop columns without checking view dependencies
- ❌ Delete users without checking FK constraints
- ❌ Modify auth.users directly (use Supabase dashboard)
- ❌ Skip staging when testing migrations
- ❌ Use CASCADE without understanding impact
- ❌ Reference `user_roles` table (being deprecated)
- ❌ **Create documentation files in the project root**
- ❌ **Create duplicate documentation**
- ❌ **Leave documentation scattered/disorganized**

### Key Files to Reference

**Core Configuration**:
- `shared/database-types.ts` - Complete TypeScript types for all tables
- `shared/supabase-types.ts` - Supabase-specific types
- `shared/schema.ts` - Legacy Drizzle schema (incomplete, for reference only)
- `supabase-schema.sql` - Base database schema
- `package.json` - Dependencies and scripts

**Documentation**:
- `docs/README.md` - Documentation index
- `docs/architecture/database-schema.md` - Database schema documentation
- `docs/development/getting-started.md` - Setup guide
- `docs/development/deployment.md` - Deployment procedures
- `docs/development/auth/` - Authentication documentation
- `docs/features/` - Feature-specific guides
- `CONTRIBUTING.md` - Development workflow and guidelines

**Migrations & Scripts**:
- `migrations/` - 19 database migration SQL files
- `migrations/README.md` - Migration guide
- `scripts/` - 21 utility SQL scripts
- `scripts/README.md` - Script documentation

### Recent Context (Nov 2025)

1. **Completed** ✅:
   - Full schema synchronization and type generation
   - Auth fixes for production (awaiting commit)
   - Comprehensive email notification system
   - Google Calendar integration for CFIs
   - Stripe payment processing
   - Complete PWA implementation
   - SEO optimization for Colorado market

2. **Pending** 🔧:
   - Duplicate aircraft columns migration (ready for testing)
   - Dual user role system migration (ready for testing)
   - Soft delete implementation for user_profiles

3. **Working** ✅:
   - Email system via Resend + Supabase SMTP
   - Stripe Checkout and webhooks
   - Google OAuth and Calendar sync
   - All authentication flows
   - Service request workflow
   - Invoice generation and payment

4. **Known Constraints** ⚠️:
   - User deletion blocked by FK constraints (needs soft delete)
   - VITE_ environment variables not available in Vercel serverless functions
   - Must use SUPABASE_URL, SUPABASE_ANON_KEY without VITE_ prefix in production

### Environment Variables Important Notes

**Development** (`.env.local`):
```env
# These work in development
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Production** (Vercel):
```env
# MUST use without VITE_ prefix for serverless functions
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Also set VITE_ versions for client-side build
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Why**: Vite only includes `VITE_` variables in client bundle during build time. Serverless functions run server-side and need non-prefixed versions at runtime.

---

## 📞 Getting Help

**Topic** | **Resource**
----------|-------------
Database Issues | `docs/architecture/database-schema.md`
Migration Issues | `migrations/README.md`
Type Errors | `shared/database-types.ts`
Authentication | `docs/development/auth/SUPABASE_AUTH_PRODUCTION_GUIDE.md`
Email Configuration | `docs/setup/email-configuration.md`
Stripe Setup | `docs/setup/stripe-configuration.md`
Deployment | `docs/development/deployment.md`
Troubleshooting | `docs/development/troubleshooting.md`
Google Integration | `docs/features/google-integration.md`
Getting Started | `docs/development/getting-started.md`
User Roles | This document (User System & Authentication section)
Feature Documentation | `docs/features/`
General Questions | `docs/README.md`

**Last Updated**: November 20, 2025  
**Updated By**: AI Assistant + User Collaboration  
**Next Review**: After pending migrations complete  

---

## 📋 Document Structure Summary

```
FreedomAviation-1/
├── README.md                      # Project overview (you are here)
├── CONTRIBUTING.md                # Contribution guidelines
├── CURSOR_CONTEXT.md              # AI assistant reference
├── docs/
│   ├── README.md                  # Documentation index
│   ├── architecture/              # System architecture & database
│   ├── development/               # Development guides
│   │   ├── auth/                  # Authentication documentation
│   │   ├── getting-started.md
│   │   ├── deployment.md
│   │   ├── troubleshooting.md
│   │   └── database-migrations.md
│   ├── features/                  # Feature documentation
│   ├── setup/                     # Configuration guides
│   └── design/                    # Design guidelines
├── migrations/                    # Database migrations (19 files)
├── scripts/                       # Utility scripts (21 files)
└── [source code directories...]
```

---

**END OF CURSOR CONTEXT DOCUMENT**

This file should be referenced at the start of any significant code changes or debugging sessions.

