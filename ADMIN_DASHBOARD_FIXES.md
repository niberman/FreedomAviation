# Admin Dashboard Data Accuracy Fixes

> **Note:** This document describes historical fixes that have been applied. It's kept for reference regarding database schema changes and migrations.

## Summary
Fixed all data accuracy issues in the admin dashboard to ensure proper integration with Supabase.

## Schema Changes

### 1. Added Missing Columns
- **aircraft.base_location**: Added TEXT column to store aircraft base airport location (e.g., KAPA, KBJC)
- **service_requests.requested_for**: Added TEXT column to store requested time/date info for service requests
- **memberships.updated_at**: Added timestamp column for tracking updates

### 2. Fixed Memberships Table
Updated memberships table to match TypeScript types:
- Renamed `user_id` to `owner_id` (consistent with codebase)
- Renamed `class` to `tier` (consistent with TypeScript types)
- Changed `monthly_rate` to `monthly_credits` (INTEGER)
- Added `credits_remaining` field
- Renamed `active` to `is_active`
- Added `updated_at` timestamp
- Updated RLS policies to use `owner_id`

### 3. Added Missing Tables

#### service_tasks
Tracks service tasks (readiness, avionics DB updates, etc.) for aircraft.
- id, aircraft_id, type, status, assigned_to, notes, photos, completed_at, timestamps
- Full RLS policies for owners/admins/CFIs
- Proper indexes and triggers

#### consumable_events
Tracks consumable top-offs (oil, O2, TKS, etc.).
- id, aircraft_id, kind, quantity, unit, notes, timestamps
- Full RLS policies for owners/admins/CFIs
- Proper indexes and triggers

### 4. RLS Policies
All new tables have proper Row Level Security:
- Owners can view data for their aircraft
- Admins and CFIs can view all data
- Only admins/CFIs can insert/update/delete
- Proper indexes for performance

## Code Changes

### staff-dashboard.tsx
1. **Aircraft Query**: Now fetches `base_location` from database instead of hardcoding 'KAPA'
2. **Service Requests Status Mapping**: Added bidirectional mapping between database statuses and Kanban board statuses
   - DB: `pending`, `in_progress`, `completed`, `cancelled`
   - Kanban: `new`, `in_progress`, `done`

### kanban-board.tsx
1. **Status Mapping on Drop**: Maps Kanban statuses back to database statuses when saving
   - Ensures data consistency between UI and database

## Migration Script
Created `scripts/add-missing-tables.sql` for existing databases:
- Adds missing columns safely (only if they don't exist)
- Creates missing tables with proper RLS
- Adds indexes and triggers
- Idempotent - can be run multiple times safely

## Verification
All queries now properly:
- ✅ Fetch data from Supabase tables
- ✅ Use correct field names matching schema
- ✅ Handle status mappings correctly
- ✅ Support proper owner/aircraft relationships
- ✅ Work with RLS policies

## Migration

For existing databases, run:
```sql
-- In Supabase SQL Editor, run:
-- See: scripts/add-missing-tables.sql
```

Or manually apply the schema changes from `supabase-schema.sql` for new setups.

