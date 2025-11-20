# Database Schema Reference

**Last Updated**: November 2025  
**Status**: ✅ Production Schema

This document provides a comprehensive reference for the Freedom Aviation database schema, including table structures, relationships, and important notes.

## Quick Links

- [Core Tables](#core-tables)
- [User System](#user-system)
- [Aircraft & Operations](#aircraft--operations)
- [Financial System](#financial-system)
- [Maintenance](#maintenance)
- [Schema Issues & Migrations](#schema-issues--migrations)
- [Entity Relationship Diagram](#entity-relationship-diagram)

---

## Overview

Freedom Aviation uses **Supabase (PostgreSQL)** with the following features:
- **Row Level Security (RLS)** on all public tables
- **Triggers** for automatic user profile creation and timestamps
- **Database Functions** for complex operations (invoice creation, finalization)
- **Views** for common query patterns
- **Enums** for type safety

### Table Count
- **24 active tables** in production
- **3 database views** for optimized queries
- **6 enum types** for data consistency

---

## Core Tables

### user_profiles

Central user table that extends Supabase Auth.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Role Enum**:
```sql
CREATE TYPE user_role AS ENUM (
  'owner',    -- Aircraft owner/client (default)
  'cfi',      -- Certified Flight Instructor
  'staff',    -- Operations staff
  'ops',      -- Operations manager
  'admin',    -- System administrator
  'founder'   -- Company founder (super admin)
);
```

**Important Notes**:
- ID matches `auth.users(id)` from Supabase Auth
- Created automatically by `handle_new_user` trigger
- RLS policies control data access based on role

**Relationships**:
- Referenced by: `aircraft`, `memberships`, `service_requests`, `invoices`, `flight_logs`, `cfi_schedule`, etc.

---

## User System

### Authentication Flow

```
1. User signs up
   ↓
2. auth.users record created (Supabase)
   ↓
3. handle_new_user trigger fires
   ↓
4. user_profiles record created
   ↓
5. assign_default_role trigger sets role='owner'
```

### User Invitation System

The application uses Supabase's secure invitation flow:
1. Admin invites user via `supabase.auth.admin.inviteUserByEmail()`
2. User receives email with secure magic link (expires in 24 hours)
3. User sets their own password
4. User redirected to dashboard

**Benefits**:
- No password sharing between admin and user
- Email verification built-in
- Secure magic links
- User controls their own password

---

## Aircraft & Operations

### aircraft

Core asset table for aircraft management.

```sql
CREATE TABLE aircraft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tail_number TEXT UNIQUE NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  class TEXT,
  hobbs_hours NUMERIC(10,2),
  tach_hours NUMERIC(10,2),
  image_url TEXT,
  owner_id UUID REFERENCES user_profiles(id),
  base_location TEXT,
  status TEXT DEFAULT 'active',
  usable_fuel_gal NUMERIC(6,1),
  tabs_fuel_gal NUMERIC(6,1),
  has_tks BOOLEAN DEFAULT false,
  has_oxygen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Important Columns**:
- `tail_number` - Unique identifier (e.g., "N12345")
- `hobbs_hours` / `tach_hours` - Engine hours tracking
- `has_tks` - De-ice system presence
- `has_oxygen` - Oxygen system availability

**⚠️ Known Issue**: Database previously had duplicate columns `hobbs_time`/`tach_time`. See [Schema Issues](#schema-issues--migrations) section.

**Relationships**:
- `owner_id` → `user_profiles.id`
- Referenced by: `service_requests`, `maintenance`, `flight_logs`, `invoices`, etc.

### service_requests

Service workflow management (fuel, cleaning, maintenance, etc.).

```sql
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES aircraft(id),
  user_id UUID REFERENCES user_profiles(id),
  service_type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  description TEXT,
  status service_status DEFAULT 'pending',
  assigned_to UUID REFERENCES user_profiles(id),
  airport TEXT,
  requested_departure TIMESTAMPTZ,
  requested_date DATE,
  requested_time TIME,
  fuel_grade TEXT,
  fuel_quantity NUMERIC(6,1),
  cabin_provisioning JSONB,
  o2_topoff BOOLEAN DEFAULT false,
  tks_topoff BOOLEAN DEFAULT false,
  gpu_required BOOLEAN DEFAULT false,
  hangar_pullout BOOLEAN DEFAULT false,
  is_extra_charge BOOLEAN DEFAULT false,
  credits_used INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status Enum**:
```sql
CREATE TYPE service_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);
```

**Service Types**: `fuel`, `cleaning`, `towing`, `maintenance`, `inspection`, `custom`

**Workflow**:
1. Owner creates request (status: `pending`)
2. Staff assigns to self (`assigned_to` set)
3. Status → `in_progress`
4. Work completed
5. Status → `completed`
6. Credits deducted from membership

### flight_logs

Flight record keeping for compliance and tracking.

```sql
CREATE TABLE flight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES aircraft(id),
  pilot_id UUID REFERENCES user_profiles(id),
  verified_by UUID REFERENCES user_profiles(id),
  departure_date DATE NOT NULL,
  departure_airport TEXT,
  arrival_airport TEXT,
  hobbs_start NUMERIC(10,2),
  hobbs_end NUMERIC(10,2),
  hobbs_duration NUMERIC(10,2),
  tach_start NUMERIC(10,2),
  tach_end NUMERIC(10,2),
  tach_duration NUMERIC(10,2),
  flight_type TEXT,
  landings INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Financial System

### invoices

Invoice header table for billing.

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES user_profiles(id),
  aircraft_id UUID REFERENCES aircraft(id),  -- nullable
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC(10,2),
  status TEXT DEFAULT 'draft',
  category TEXT,
  created_by_cfi_id UUID REFERENCES user_profiles(id),
  due_date DATE,
  paid_date DATE,
  line_items JSONB,  -- legacy field
  stripe_checkout_id TEXT,
  stripe_payment_id TEXT,
  total_cents INTEGER,
  period_start DATE,
  period_end DATE,
  hosted_invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status Values**: `draft`, `finalized`, `paid`, `void`

**Categories**: `membership`, `instruction`, `service`

**Important**:
- `aircraft_id` is **nullable** to support non-aircraft invoices (memberships, general instruction)
- Uses `invoice_lines` table for line items (not JSONB `line_items` field)

### invoice_lines

Invoice line items (normalized structure).

```sql
CREATE TABLE invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,  -- can be decimal (e.g., 1.5 hours)
  unit_cents INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,  -- computed: quantity * unit_cents
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example Line Items**:
```json
{
  "description": "Flight Instruction",
  "quantity": 2.5,
  "unit_cents": 12000,  // $120/hour
  "amount_cents": 30000  // $300 total
}
```

### memberships

User membership subscriptions.

```sql
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES user_profiles(id),
  aircraft_id UUID REFERENCES aircraft(id),
  tier membership_class,
  tier_id UUID REFERENCES membership_tiers(id),
  monthly_credits INTEGER DEFAULT 0,
  credits_remaining INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aircraft_id, is_active)  -- only one active membership per aircraft
);
```

**Membership Class Enum**:
```sql
CREATE TYPE membership_class AS ENUM ('I', 'II', 'III');
```

---

## Maintenance

### maintenance

Maintenance tracking and scheduling.

```sql
CREATE TABLE maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES aircraft(id),
  item_name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_hobbs NUMERIC(10,2),
  due_tach NUMERIC(10,2),
  status maintenance_status DEFAULT 'current',
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status Enum**:
```sql
CREATE TYPE maintenance_status AS ENUM (
  'current',
  'due_soon',
  'overdue'
);
```

**Common Maintenance Items**:
- Annual inspection
- 100-hour inspection
- Oil change
- VOR check
- ELT battery replacement

### consumable_events

Tracking of consumables (fuel, oil, oxygen, TKS).

```sql
CREATE TABLE consumable_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES aircraft(id),
  kind TEXT NOT NULL,  -- 'fuel', 'oil', 'oxygen', 'tks'
  quantity NUMERIC(10,2),
  unit TEXT,  -- 'gallons', 'quarts', 'pounds'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Database Views

Views provide optimized query patterns for common operations.

### v_owner_aircraft

Owner's aircraft view with computed fields.

```sql
CREATE VIEW v_owner_aircraft AS
SELECT 
  a.*,
  -- Add computed fields here
FROM aircraft a
WHERE a.owner_id = auth.uid();
```

**⚠️ Important**: This view depends on `hobbs_hours` and `tach_hours` columns. If renaming these columns, update the view first.

### v_service_requests

Service requests with related data joined.

```sql
CREATE VIEW v_service_requests AS
SELECT 
  sr.*,
  a.tail_number,
  u.full_name AS requester_name
FROM service_requests sr
LEFT JOIN aircraft a ON sr.aircraft_id = a.id
LEFT JOIN user_profiles u ON sr.user_id = u.id;
```

### v_memberships

Memberships with tier information joined.

```sql
CREATE VIEW v_memberships AS
SELECT 
  m.*,
  mt.name AS tier_name,
  mt.monthly_base_rate AS base_price
FROM memberships m
LEFT JOIN membership_tiers mt ON m.tier_id = mt.id;
```

---

## Database Functions

### create_instruction_invoice

Creates an instruction invoice with optional aircraft.

```sql
CREATE FUNCTION create_instruction_invoice(
  p_owner_id UUID,
  p_cfi_id UUID,
  p_aircraft_id UUID,  -- nullable
  p_description TEXT,
  p_hours NUMERIC,
  p_rate_cents INTEGER
) RETURNS UUID
```

**Authorization**:
- User must be authenticated
- User must be the CFI or an admin/founder
- User must have role: `cfi`, `staff`, `admin`, or `founder`

**What it does**:
1. Creates invoice with status `draft`
2. Generates unique invoice number
3. Creates invoice line item
4. Returns invoice ID

### finalize_invoice

Finalizes a draft invoice (changes status to `sent`).

```sql
CREATE FUNCTION finalize_invoice(
  p_invoice_id UUID
) RETURNS BOOLEAN
```

**Authorization**:
- User must be: invoice owner, creating CFI, or admin/staff/founder
- Invoice must be in `draft` status

---

## Schema Issues & Migrations

### Known Issues (Historical)

#### 1. Aircraft Duplicate Columns ✅ Resolved

**Issue**: Database had both `hobbs_time`/`tach_time` AND `hobbs_hours`/`tach_hours`

**Resolution**: 
- Migration created: `migrations/cleanup_aircraft_duplicate_columns.sql`
- Old columns (`hobbs_time`, `tach_time`) removed
- View `v_owner_aircraft` updated to use correct columns

#### 2. User Roles Duplication ✅ Resolved

**Issue**: Two separate systems for storing user roles:
- `user_profiles.role` (user_role enum) ✅ CORRECT
- `user_roles` table (app_role enum) ❌ DEPRECATED

**Resolution**:
- Migration created: `migrations/resolve_user_roles_duplication.sql`
- Data migrated from `user_roles` table → `user_profiles.role` column
- `user_roles` table dropped
- `app_role` enum removed

### Current Schema State

✅ **Clean**: No duplicate columns  
✅ **Consistent**: Single source of truth for roles  
✅ **Typed**: All TypeScript types match database  
✅ **Secured**: RLS enabled on all public tables

---

## Entity Relationship Diagram

### High-Level Relationships

```
auth.users (Supabase)
    ↓
user_profiles (1)
    ├──→ aircraft (N)
    │     ├──→ service_requests (N)
    │     ├──→ maintenance (N)
    │     ├──→ flight_logs (N)
    │     └──→ consumable_events (N)
    ├──→ memberships (N)
    ├──→ invoices (N)
    │     └──→ invoice_lines (N)
    ├──→ service_requests (N)
    ├──→ flight_logs (N)
    └──→ cfi_schedule (N)
```

### Foreign Key Constraints

**user_profiles is referenced by**:
- `aircraft.owner_id`
- `memberships.owner_id`
- `service_requests.user_id`
- `service_requests.assigned_to`
- `invoices.owner_id`
- `invoices.created_by_cfi_id`
- `flight_logs.pilot_id`
- `flight_logs.verified_by`
- `instruction_requests.student_id`
- `instruction_requests.cfi_id`
- `cfi_schedule.cfi_id`

**aircraft is referenced by**:
- `service_requests.aircraft_id`
- `maintenance.aircraft_id`
- `flight_logs.aircraft_id`
- `memberships.aircraft_id`
- `invoices.aircraft_id` (nullable)
- `consumable_events.aircraft_id`

**invoices is referenced by**:
- `invoice_lines.invoice_id` (with CASCADE delete)

---

## Row Level Security (RLS)

All public tables have RLS enabled with the following patterns:

### Pattern 1: Owner Access
```sql
CREATE POLICY "owners_own_data" ON table_name
  FOR SELECT USING (owner_id = auth.uid());
```

### Pattern 2: Staff Access
```sql
CREATE POLICY "staff_see_all" ON table_name
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin', 'founder')
    )
  );
```

### Pattern 3: Public Read
```sql
CREATE POLICY "public_read" ON table_name
  FOR SELECT USING (true);
```

**Important**: RLS policies must be carefully written to avoid infinite recursion, especially on `user_profiles` table.

---

## Database Triggers

### handle_new_user

Automatically creates `user_profiles` record when user signs up.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### assign_default_role

Sets default role to `owner` if not specified.

```sql
CREATE TRIGGER set_default_role
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_role();
```

### update_updated_at_column

Automatically updates `updated_at` timestamp.

```sql
CREATE TRIGGER update_{table}_timestamp
  BEFORE UPDATE ON {table}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Performance Considerations

### Recommended Indexes

```sql
-- Most important for query performance
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_invoices_owner_status ON invoices(owner_id, status);
CREATE INDEX idx_aircraft_owner ON aircraft(owner_id);
CREATE INDEX idx_flight_logs_aircraft_date ON flight_logs(aircraft_id, created_at DESC);
CREATE INDEX idx_memberships_owner_active ON memberships(owner_id, is_active);
```

### Common Query Patterns

1. **List aircraft by owner**: `SELECT * FROM aircraft WHERE owner_id = ?`
2. **List service requests by status**: `SELECT * FROM service_requests WHERE status = ? ORDER BY created_at DESC`
3. **Get user's active membership**: `SELECT * FROM memberships WHERE owner_id = ? AND is_active = true`
4. **List invoices for owner**: `SELECT * FROM invoices WHERE owner_id = ? ORDER BY created_at DESC`
5. **Get maintenance due**: `SELECT * FROM maintenance WHERE aircraft_id = ? AND status IN ('due_soon', 'overdue')`

---

## Troubleshooting

### User Deletion Blocked

**Problem**: Cannot delete users with related records

**Reason**: FK constraints without CASCADE

**Solutions**:
1. Implement soft delete (recommended)
2. Reassign ownership before deletion
3. Add CASCADE to FKs (dangerous - will delete all user data)

### View Dependency Errors

**Problem**: Cannot modify column used by view

**Solution**:
1. Drop the view first
2. Modify the column
3. Recreate the view

### RLS Policy Issues

**Problem**: Users can't access their own data

**Check**:
```sql
-- Verify user's role
SELECT role FROM user_profiles WHERE id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Test with specific role
SET ROLE authenticated;
SELECT * FROM user_profiles;
```

---

## Related Documentation

- [Database Schema Documentation](../architecture/database-schema.md) - Detailed schema guide
- [Database Migrations](../development/database-migrations.md) - Migration procedures
- [Getting Started](../development/getting-started.md) - Development setup

---

**Last Verified**: November 2025  
**Verified By**: Development Team  
**Next Review**: After major schema changes

