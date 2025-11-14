# Freedom Aviation - Entity Relationship Diagram

**Database Schema Visualization**  
**24 Tables, 30+ Relationships**

---

## Core Entities Overview

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth)
│  - id (PK)      │
│  - email        │
└────────┬────────┘
         │
         │ references
         ▼
┌─────────────────┐
│ user_profiles   │ ◄─── Central user table
│  - id (PK=FK)   │
│  - email        │
│  - full_name    │
│  - phone        │
│  - role         │ ──► enum: owner|cfi|staff|admin|ops|founder
│  - created_at   │
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┬─────────────┐
         │              │              │              │             │
         ▼              ▼              ▼              ▼             ▼
    aircraft    memberships    service_requests  invoices    flight_logs
```

---

## 1. User & Authentication

```
┌──────────────────────┐
│   auth.users         │  Supabase managed
│   - id (PK)          │
│   - email (unique)   │
│   - encrypted_pwd    │
└──────────┬───────────┘
           │ id
           ▼
┌──────────────────────┐
│   user_profiles      │  Extended user data
│   - id (PK, FK)      │ ──references──► auth.users(id)
│   - email            │
│   - full_name        │
│   - phone            │
│   - role             │  UserRole enum
│   - created_at       │
│   - updated_at       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   user_roles         │  Additional role assignments
│   - id (PK)          │
│   - user_id (FK)     │ ──references──► user_profiles(id)
│   - role             │
│   - created_at       │
└──────────────────────┘
```

---

## 2. Aircraft & Ownership

```
┌──────────────────────┐
│   aircraft           │  Core asset
│   - id (PK)          │
│   - tail_number (UK) │  Unique identifier
│   - make             │
│   - model            │
│   - year             │
│   - class            │
│   - hobbs_hours      │
│   - tach_hours       │
│   - image_url        │
│   - owner_id (FK)    │ ──references──► user_profiles(id)
│   - base_location    │
│   - has_tks          │  TKS de-ice system
│   - has_oxygen       │
│   - created_at       │
│   - updated_at       │
└──────────┬───────────┘
           │
           │ Referenced by:
           ├────► service_requests.aircraft_id
           ├────► service_tasks.aircraft_id
           ├────► maintenance.aircraft_id
           ├────► consumable_events.aircraft_id
           ├────► flight_logs.aircraft_id
           ├────► memberships.aircraft_id
           ├────► invoices.aircraft_id
           ├────► instruction_requests.aircraft_id
           └────► cfi_schedule.aircraft_id
```

---

## 3. Membership System

```
┌─────────────────────────┐
│  membership_tiers       │  Tier definitions (I, II, III)
│  - id (PK)              │
│  - name (UK)            │  "Class I", "Class II", etc
│  - slug                 │
│  - description          │
│  - monthly_base_rate    │
│  - features (JSONB)     │
│  - sort_order           │
│  - is_active            │
└─────────┬───────────────┘
          │ tier_id
          ▼
┌─────────────────────────┐
│  memberships            │  User membership records
│  - id (PK)              │
│  - owner_id (FK)        │ ──references──► user_profiles(id)
│  - aircraft_id (FK)     │ ──references──► aircraft(id)
│  - tier                 │  membership_class enum
│  - tier_id (FK)         │ ──references──► membership_tiers(id)
│  - monthly_credits      │
│  - credits_remaining    │
│  - is_active (UK)       │  Unique constraint with aircraft_id
│  - start_date           │
│  - end_date             │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│  membership_quotes      │  Onboarding quotes
│  - id (PK)              │
│  - user_id (FK)         │ ──references──► user_profiles(id)
│  - package_id           │
│  - tier_name            │
│  - base_monthly         │
│  - hangar_id            │
│  - hangar_cost          │
│  - total_monthly        │
│  - aircraft_tail        │
│  - aircraft_make        │
│  - aircraft_model       │
│  - status               │
│  - notes                │
│  - created_at           │
└─────────────────────────┘
```

---

## 4. Service Management

```
┌─────────────────────────┐
│  service_requests       │  Main service workflow
│  - id (PK)              │
│  - aircraft_id (FK)     │ ──references──► aircraft(id)
│  - user_id (FK)         │ ──references──► user_profiles(id)
│  - service_type         │  "fuel", "cleaning", "towing", etc
│  - priority             │  "low", "medium", "high", "urgent"
│  - description          │
│  - status               │  enum: pending|in_progress|completed|cancelled
│  - assigned_to (FK)     │ ──references──► user_profiles(id)
│  - airport              │
│  - requested_departure  │
│  - requested_date       │
│  - requested_time       │
│  - fuel_grade           │  "100LL", "Jet-A"
│  - fuel_quantity        │
│  - cabin_provisioning   │  JSONB
│  - o2_topoff            │  boolean
│  - tks_topoff           │  boolean
│  - gpu_required         │  boolean
│  - hangar_pullout       │  boolean
│  - is_extra_charge      │
│  - credits_used         │
│  - notes                │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘

┌─────────────────────────┐
│  service_tasks          │  Granular task tracking
│  - id (PK)              │
│  - aircraft_id (FK)     │ ──references──► aircraft(id)
│  - type                 │
│  - status               │  ServiceStatus enum
│  - assigned_to (FK)     │ ──references──► user_profiles(id)
│  - notes                │
│  - photos (array)       │
│  - completed_at         │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘

┌─────────────────────────┐
│  support_tickets        │  Support system
│  - id (PK)              │
│  - owner_id (FK)        │ ──references──► user_profiles(id)
│  - [other fields...]    │
└─────────────────────────┘
```

---

## 5. Financial System

```
┌─────────────────────────┐
│  invoices               │  Invoice header
│  - id (PK)              │
│  - owner_id (FK)        │ ──references──► user_profiles(id)
│  - aircraft_id (FK)     │ ──references──► aircraft(id) [nullable]
│  - invoice_number (UK)  │
│  - amount               │
│  - status               │  "draft", "finalized", "paid", "void"
│  - category             │  "membership", "instruction", "service"
│  - created_by_cfi_id    │ ──references──► user_profiles(id)
│  - due_date             │
│  - paid_date            │
│  - line_items (JSONB)   │  Legacy field
│  - stripe_checkout_id   │
│  - stripe_payment_id    │
│  - created_at           │
│  - updated_at           │
└─────────┬───────────────┘
          │
          │ invoice_id
          ▼
┌─────────────────────────┐
│  invoice_lines          │  Line items
│  - id (PK)              │
│  - invoice_id (FK)      │ ──references──► invoices(id)
│  - description          │
│  - quantity             │  Can be decimal (e.g., 1.5 hours)
│  - unit_cents           │  Price in cents
│  - amount_cents         │  Computed: quantity * unit_cents
│  - created_at           │
└─────────────────────────┘

┌─────────────────────────┐
│  client_billing_prof    │  Billing preferences
│  - user_id (PK, FK)     │ ──references──► user_profiles(id)
│  - [other fields...]    │
└─────────────────────────┘
```

---

## 6. Flight Operations

```
┌─────────────────────────┐
│  flight_logs            │  Flight record keeping
│  - id (PK)              │
│  - aircraft_id (FK)     │ ──references──► aircraft(id)
│  - pilot_id (FK)        │ ──references──► user_profiles(id)
│  - verified_by (FK)     │ ──references──► user_profiles(id)
│  - departure_date       │
│  - departure_airport    │
│  - arrival_airport      │
│  - hobbs_start          │
│  - hobbs_end            │
│  - hobbs_duration       │
│  - tach_start           │
│  - tach_end             │
│  - tach_duration        │
│  - flight_type          │
│  - landings             │
│  - notes                │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘

┌─────────────────────────┐
│  instruction_requests   │  Flight training requests
│  - id (PK)              │
│  - student_id (FK)      │ ──references──► user_profiles(id)
│  - cfi_id (FK)          │ ──references──► user_profiles(id)
│  - aircraft_id (FK)     │ ──references──► aircraft(id)
│  - requested_date       │
│  - requested_time       │
│  - duration_hours       │
│  - lesson_type          │
│  - status               │
│  - notes                │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘

┌─────────────────────────┐
│  cfi_schedule           │  CFI availability
│  - id (PK)              │
│  - cfi_id (FK)          │ ──references──► user_profiles(id)
│  - owner_id (FK)        │ ──references──► user_profiles(id) [nullable]
│  - aircraft_id (FK)     │ ──references──► aircraft(id) [nullable]
│  - date                 │
│  - start_time           │
│  - end_time             │
│  - status               │  "available", "booked", "blocked"
│  - notes                │
│  - google_event_id      │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘
```

---

## 7. Maintenance

```
┌─────────────────────────┐
│  maintenance            │  Maintenance tracking
│  - id (PK)              │
│  - aircraft_id (FK)     │ ──references──► aircraft(id)
│  - item_name            │  "Annual", "100hr", "Oil Change"
│  - description          │
│  - due_date             │
│  - due_hobbs            │
│  - due_tach             │
│  - status               │  enum: current|due_soon|overdue
│  - completed_date       │
│  - notes                │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘

┌─────────────────────────┐
│  consumable_events      │  Fuel, oil, oxygen usage
│  - id (PK)              │
│  - aircraft_id (FK)     │ ──references──► aircraft(id)
│  - kind                 │  "fuel", "oil", "oxygen", "tks"
│  - quantity             │
│  - unit                 │  "gallons", "quarts"
│  - notes                │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘
```

---

## 8. Pricing System

```
┌─────────────────────────┐
│  pricing_locations      │  Hangar locations
│  - id (PK)              │
│  - name                 │  "KSMF - Sacramento Executive"
│  - slug (UK)            │  "ksmf"
│  - hangar_cost_monthly  │
│  - description          │
│  - address              │
│  - features (JSONB)     │
│  - active               │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘

┌─────────────────────────┐
│  pricing_classes        │  Aircraft classes for pricing
│  - id (PK)              │
│  - name                 │  "Class I", "Class II", "Class III"
│  - slug (UK)            │  "class-i", "class-ii", "class-iii"
│  - base_monthly         │
│  - description          │
│  - features (JSONB)     │
│  - sort_order           │
│  - active               │
│  - created_at           │
└─────────────────────────┘

┌─────────────────────────┐
│  settings_pricing_assm  │  Pricing calculation settings
│  - id (PK)              │
│  - labor_rate           │  $/hour
│  - card_fee_pct         │  Credit card fee %
│  - cfi_allocation       │  CFI budget allocation
│  - cleaning_supplies    │  Monthly cleaning budget
│  - overhead_per_ac      │  Per-aircraft overhead
│  - avionics_db_per_ac   │  Database subscription cost
│  - updated_at           │
└─────────────────────────┘
```

---

## 9. Configuration & Integration

```
┌─────────────────────────┐
│  settings               │  App-wide settings
│  - id (PK)              │
│  - [config fields...]   │
└─────────────────────────┘

┌─────────────────────────┐
│  onboarding_data        │  User onboarding progress
│  - id (PK)              │
│  - user_id (FK, UK)     │ ──references──► user_profiles(id)
│  - step                 │  Current onboarding step
│  - personal_info (JSON) │
│  - aircraft_info (JSON) │
│  - membership_sel(JSON) │
│  - stripe_customer_id   │
│  - stripe_sub_id        │
│  - completed            │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘

┌─────────────────────────┐
│  google_calendar_tokens │  OAuth integration
│  - id (PK)              │
│  - user_id (FK, UK)     │ ──references──► user_profiles(id)
│  - access_token         │
│  - refresh_token        │
│  - token_expiry         │
│  - calendar_id          │
│  - sync_enabled         │
│  - last_sync_at         │
│  - created_at           │
│  - updated_at           │
└─────────────────────────┘

┌─────────────────────────┐
│  email_notifications    │  Email queue
│  - id (PK)              │
│  - [email fields...]    │
└─────────────────────────┘
```

---

## Relationship Summary

### Many-to-One Relationships (Foreign Keys)

**user_profiles is referenced by:**
- aircraft.owner_id
- memberships.owner_id
- service_requests.user_id
- service_requests.assigned_to
- service_tasks.assigned_to
- invoices.owner_id
- invoices.created_by_cfi_id
- flight_logs.pilot_id
- flight_logs.verified_by
- instruction_requests.student_id
- instruction_requests.cfi_id
- cfi_schedule.cfi_id
- cfi_schedule.owner_id
- support_tickets.owner_id
- user_roles.user_id
- membership_quotes.user_id
- onboarding_data.user_id
- google_calendar_tokens.user_id
- client_billing_profiles.user_id

**aircraft is referenced by:**
- service_requests.aircraft_id
- service_tasks.aircraft_id
- maintenance.aircraft_id
- consumable_events.aircraft_id
- flight_logs.aircraft_id
- memberships.aircraft_id
- invoices.aircraft_id (nullable)
- instruction_requests.aircraft_id
- cfi_schedule.aircraft_id (nullable)

**invoices is referenced by:**
- invoice_lines.invoice_id

**membership_tiers is referenced by:**
- memberships.tier_id

### Unique Constraints

- aircraft.tail_number
- user_profiles.id (also PK)
- membership_tiers.name
- pricing_locations.slug
- pricing_classes.slug
- memberships.aircraft_id + is_active (only one active per aircraft)
- onboarding_data.user_id
- google_calendar_tokens.user_id

### Enum Types

```sql
CREATE TYPE membership_class AS ENUM ('I', 'II', 'III');
CREATE TYPE service_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE maintenance_status AS ENUM ('current', 'due_soon', 'overdue');
CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');
```

---

## Data Flow Diagrams

### Onboarding Flow
```
User Signs Up
     │
     ▼
auth.users created (Supabase)
     │
     ▼
user_profiles created (trigger)
     │
     ▼
onboarding_data created
     │
     ├───► Personal info collected
     ├───► Aircraft info collected
     ├───► Membership tier selected
     │      │
     │      ▼
     │   membership_quotes created
     │      │
     │      ▼
     │   Stripe subscription created
     │      │
     │      ▼
     └───► membership created
            │
            ▼
        aircraft created
```

### Service Request Flow
```
Owner creates request
     │
     ▼
service_requests (status: pending)
     │
     ▼
Staff assigns to self (assigned_to set)
     │
     ▼
Status → in_progress
     │
     ├───► service_tasks created (optional)
     │
     ▼
Work completed
     │
     ▼
Status → completed
     │
     ▼
Credits deducted from membership
```

### Invoice Flow
```
CFI creates invoice
     │
     ▼
invoices (status: draft)
     │
     ├───► invoice_lines added
     │
     ▼
Status → finalized
     │
     ▼
Email sent to owner (via API)
     │
     ▼
Stripe checkout session created
     │
     ▼
Owner pays online
     │
     ▼
Webhook updates invoice
     │
     ▼
Status → paid, paid_date set
```

---

## Table Statistics

| Category | Count | Examples |
|----------|-------|----------|
| **Core Tables** | 5 | user_profiles, aircraft, memberships, user_roles, membership_tiers |
| **Service Management** | 3 | service_requests, service_tasks, support_tickets |
| **Flight Operations** | 3 | flight_logs, instruction_requests, cfi_schedule |
| **Financial** | 3 | invoices, invoice_lines, client_billing_profiles |
| **Maintenance** | 2 | maintenance, consumable_events |
| **Pricing** | 3 | pricing_locations, pricing_classes, settings_pricing_assumptions |
| **Configuration** | 4 | settings, onboarding_data, google_calendar_tokens, email_notifications |
| **Quotes** | 1 | membership_quotes |
| **TOTAL** | **24** | |

---

## Performance Considerations

### Recommended Indexes

See `scripts/add-performance-indexes.sql` for full list:

```sql
-- Most important for query performance:
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_invoices_owner_status ON invoices(owner_id, status);
CREATE INDEX idx_aircraft_owner ON aircraft(owner_id);
CREATE INDEX idx_flight_logs_aircraft_date ON flight_logs(aircraft_id, created_at DESC);
CREATE INDEX idx_memberships_owner_active ON memberships(owner_id, is_active);
```

### Query Patterns

**Most Common Queries:**
1. List aircraft by owner: `SELECT * FROM aircraft WHERE owner_id = ?`
2. List service requests by status: `SELECT * FROM service_requests WHERE status = ? ORDER BY created_at DESC`
3. Get user's active membership: `SELECT * FROM memberships WHERE owner_id = ? AND is_active = true`
4. List invoices for owner: `SELECT * FROM invoices WHERE owner_id = ? ORDER BY created_at DESC`
5. Get maintenance due for aircraft: `SELECT * FROM maintenance WHERE aircraft_id = ? AND status IN ('due_soon', 'overdue')`

---

**END OF ERD**


