# Database Schema Guide

## Overview

Freedom Aviation uses Supabase (PostgreSQL) with Row Level Security (RLS) for data access control.

## Core Tables

### user_profiles
Extends Supabase Auth with application-specific user data.

**Columns:**
- `id` (UUID, PK) - Links to auth.users
- `email` (TEXT) - User email
- `full_name` (TEXT) - Display name
- `role` (TEXT) - One of: owner, cfi, staff, admin
- `phone` (TEXT) - Contact phone
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can view their own profile
- Admins and CFIs can view all profiles
- Users can update their own profile

### aircraft
Aircraft registry with ownership and maintenance tracking.

**Columns:**
- `id` (UUID, PK)
- `tail_number` (TEXT, UNIQUE) - FAA registration
- `make` (TEXT) - Manufacturer
- `model` (TEXT) - Aircraft model
- `year` (INTEGER) - Year of manufacture
- `class` (TEXT) - Aircraft classification
- `hobbs_hours` (DECIMAL) - Hobbs meter reading
- `tach_hours` (DECIMAL) - Tach meter reading
- `owner_id` (UUID, FK → user_profiles)
- `image_url` (TEXT) - Aircraft photo
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Owners see only their aircraft
- CFIs and admins see all aircraft
- Only admins can insert/update/delete

### memberships
Owner membership tiers and pricing.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → user_profiles)
- `aircraft_id` (UUID, FK → aircraft)
- `class` (TEXT) - Class I, II, or III
- `monthly_rate` (DECIMAL) - Monthly fee
- `active` (BOOLEAN) - Membership status
- `start_date` (DATE)
- `end_date` (DATE)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### maintenance
Aircraft maintenance tracking and scheduling.

**Columns:**
- `id` (UUID, PK)
- `aircraft_id` (UUID, FK → aircraft)
- `item_name` (TEXT) - Maintenance item
- `due_date` (DATE) - Calendar due date
- `due_hobbs` (DECIMAL) - Hobbs-based due
- `status` (TEXT) - current, due_soon, overdue
- `notes` (TEXT)
- `completed_date` (DATE)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### service_requests
Service request queue and management.

**Columns:**
- `id` (UUID, PK)
- `aircraft_id` (UUID, FK → aircraft)
- `owner_id` (UUID, FK → user_profiles)
- `service_type` (TEXT) - maintenance, cleaning, detailing, etc.
- `description` (TEXT) - Request details
- `priority` (TEXT) - low, medium, high, urgent
- `status` (TEXT) - open, in_progress, completed, cancelled
- `requested_date` (DATE)
- `completed_date` (DATE)
- `assigned_to` (UUID, FK → user_profiles)
- `estimated_cost` (DECIMAL)
- `actual_cost` (DECIMAL)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### pricing_packages
Service package definitions and pricing.

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT) - Package name
- `class` (TEXT) - Class I, II, or III
- `monthly_rate` (DECIMAL)
- `description` (TEXT)
- `features` (JSONB) - Feature list
- `active` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### cfi_schedule
CFI availability and booking schedule.

**Columns:**
- `id` (UUID, PK)
- `cfi_id` (UUID, FK → user_profiles)
- `date` (DATE)
- `start_time` (TIME)
- `end_time` (TIME)
- `status` (TEXT) - available, booked, blocked
- `owner_id` (UUID, FK → user_profiles) - If booked
- `aircraft_id` (UUID, FK → aircraft) - If booked
- `notes` (TEXT)
- `google_calendar_event_id` (TEXT) - For sync
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### google_calendar_tokens
OAuth tokens for Google Calendar integration.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → user_profiles, UNIQUE)
- `access_token` (TEXT, ENCRYPTED)
- `refresh_token` (TEXT, ENCRYPTED)
- `token_expiry` (TIMESTAMPTZ)
- `calendar_id` (TEXT) - Selected calendar
- `sync_enabled` (BOOLEAN)
- `last_sync_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Users can only access their own tokens
- Automatic token refresh on expiry

## Row Level Security

All tables have RLS enabled with policies that enforce:

1. **Owners**: See only their own data (aircraft, requests, memberships)
2. **CFIs**: View client aircraft and schedules, manage their own schedule
3. **Admins**: Full access to all tables
4. **Public**: View pricing packages only

## Database Triggers

### on_auth_user_created
Automatically creates a user_profile when a user signs up via Supabase Auth.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Indexes

Performance indexes on frequently queried columns:
- `aircraft.owner_id`
- `aircraft.tail_number`
- `memberships.user_id`
- `service_requests.status`
- `service_requests.owner_id`
- `cfi_schedule.cfi_id`
- `cfi_schedule.date`

## Setup Scripts

- `supabase-schema.sql` - Complete schema with RLS and triggers
- `scripts/setup-admin.sql` - Promote user to admin role
- `scripts/check-setup.sql` - Verify database setup
- `scripts/add-google-calendar-integration.sql` - Add calendar tables

## Column Naming Conventions

- Use `snake_case` for all column names
- Suffix timestamps with `_at` (e.g., `created_at`)
- Suffix dates with `_date` (e.g., `due_date`)
- Use `_id` suffix for foreign keys
- Boolean columns use `is_` or verb prefixes (e.g., `active`, `sync_enabled`)

## Migration Best Practices

1. Always test migrations in development first
2. Run `scripts/check-setup.sql` after migrations
3. Verify RLS policies are still intact
4. Check that triggers are working
5. Test with different user roles

## Troubleshooting

**Profile not created after signup**
- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
- Manually create profile with `scripts/setup-admin.sql`

**RLS blocking queries**
- Verify user role in user_profiles
- Check RLS policies with `\d+ table_name` in psql
- Ensure service role key is used for admin operations

**Data not showing**
- Verify foreign key relationships
- Check that RLS allows access
- Ensure user is authenticated

