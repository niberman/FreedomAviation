# Database Scripts

Utility scripts for database setup, feature additions, and maintenance. These scripts are designed to be run manually when setting up new features or making specific database updates.

## Overview

This directory contains SQL and shell scripts for managing the Freedom Aviation database. Unlike migrations, which are historical changes, these scripts are reusable utilities for common database operations.

## Essential Setup Scripts

### setup-admin.sql
**Purpose**: Promote a user to admin role

**Usage**:
1. Replace `YOUR_EMAIL@example.com` with your email
2. Run in Supabase SQL Editor
3. Log out and back in to see changes

**Example**:
```sql
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'your@email.com';
```

**When to use**: After creating a new user account that needs admin access

## Feature Addition Scripts

### Google Integration

#### add-google-oauth-support.sql
**Purpose**: Enable Google OAuth sign-in

**What it does**:
- Updates user profile creation trigger
- Handles Google user metadata
- Extracts name from Google's `name` field

**When to use**: When adding Google OAuth to existing database

#### add-google-calendar-integration.sql
**Purpose**: Enable CFI Google Calendar sync

**What it does**:
- Creates `cfi_schedule` table
- Creates `google_calendar_tokens` table
- Sets up RLS policies
- Adds necessary indexes

**When to use**: When adding Google Calendar integration for flight instructors

### Payment Integration

#### add-stripe-fields.sql
**Purpose**: Add Stripe payment fields to user profiles

**What it does**: 
- Adds `stripe_customer_id` column
- Adds `stripe_subscription_id` column
- Enables payment tracking

**When to use**: When integrating Stripe payments

### Email System

#### add-email-triggers.sql
**Purpose**: Set up automated email notifications

**What it does**:
- Creates triggers for email notifications
- Configures email templates
- Sets up notification rules

**When to use**: When implementing automated email system

### Aircraft Management

#### add-aircraft-features.sql
**Purpose**: Add advanced aircraft management features

**What it does**: Adds columns and tables for enhanced aircraft tracking

**When to use**: When expanding aircraft management capabilities

#### add-flight-hours-column.sql
**Purpose**: Add flight hours tracking

**What it does**: Adds columns for tracking total flight hours

**When to use**: When implementing flight hour logging

### CFI & Scheduling

#### create-cfi-schedule-table.sql
**Purpose**: Create CFI schedule table

**What it does**: Creates basic CFI availability table

**Note**: Consider using `add-google-calendar-integration.sql` for more complete solution

### Flight Operations

#### create-flight-logs-table.sql
**Purpose**: Create flight logs table

**What it does**: Creates table for tracking individual flights

**When to use**: When implementing flight logging feature

### Invoice Management

#### create-payable-invoice-simple.sql
**Purpose**: Create invoice management tables

**What it does**: Creates tables and functions for invoice system

**When to use**: Initial invoice system setup

#### make-aircraft-optional-in-invoices.sql
**Purpose**: Allow invoices without aircraft

**What it does**: Modifies invoice table to make `aircraft_id` optional

**When to use**: When you need to create non-aircraft invoices (memberships, services, etc.)

## Data Update Scripts

### update-hangar-amenities.sql
**Purpose**: Update hangar locations with amenities

**What it does**: Adds/updates amenities data for hangar locations

**When to use**: When updating hangar information

### update-membership-pricing.sql
**Purpose**: Update membership tier pricing

**What it does**: Updates pricing for different membership levels

**When to use**: When adjusting membership prices

### update-pricing-classes-by-features.sql
**Purpose**: Update pricing based on aircraft features

**What it does**: Adjusts pricing tiers based on aircraft capabilities

**When to use**: When rebalancing aircraft pricing

## Role Management Scripts

### add-ops-role-manual.sql
**Purpose**: Add operations role to user

**What it does**: Grants ops role permissions

**When to use**: Creating operations team members

### add-role-column.sql
**Purpose**: Add role column to user profiles

**What it does**: Adds role support to existing database

**When to use**: Initial role system setup

### consolidate-role-enums.sql
**Purpose**: Consolidate duplicate role enums

**What it does**: Fixes issues with multiple role enum definitions

**When to use**: Fixing role enum conflicts

## Fix Scripts

### fix_user_profiles_rls_simple.sql
**Purpose**: Fix user profiles Row Level Security

**What it does**: Updates RLS policies for user profiles

**When to use**: When users can't access their own profiles

### fix-dual-enum-problem.sql
**Purpose**: Fix duplicate enum types

**What it does**: Resolves conflicts from multiple enum definitions

**When to use**: When seeing enum-related errors

### fix-enum-values.sql
**Purpose**: Fix enum value mismatches

**What it does**: Ensures enum values are consistent

**When to use**: When role values don't match enum definition

### remove-unused-enum.sql
**Purpose**: Remove obsolete enum types

**What it does**: Cleans up unused enum definitions

**When to use**: Database cleanup

### migrate-to-user-role-cascade.sql
**Purpose**: Add cascade rules to role foreign keys

**What it does**: Ensures proper cascading on role changes

**When to use**: Updating role referential integrity

## Utility Shell Scripts

### get-webhook-secret.sh
**Purpose**: Retrieve Stripe webhook secret

**Usage**:
```bash
chmod +x scripts/get-webhook-secret.sh
./scripts/get-webhook-secret.sh
```

**When to use**: Setting up Stripe webhook integration

### set-env-vars.sh
**Purpose**: Configure environment variables

**Usage**:
```bash
chmod +x scripts/set-env-vars.sh
./scripts/set-env-vars.sh
```

**When to use**: Initial environment setup

## How to Use Scripts

### Running SQL Scripts

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project
   - Click "SQL Editor"

2. **Load Script**
   - Open the `.sql` file in a text editor
   - Copy all contents

3. **Review Before Running**
   - Read through the SQL
   - Check for any placeholders (YOUR_EMAIL, etc.)
   - Replace placeholders with actual values

4. **Execute**
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success confirmation

5. **Verify**
   - Check that expected changes occurred
   - Test in the application
   - Verify no errors in console

### Running Shell Scripts

```bash
# Make executable
chmod +x scripts/script-name.sh

# Run script
./scripts/script-name.sh

# Or run from project root
./scripts/script-name.sh
```

## Best Practices

### Before Running Scripts

1. **Backup Your Database** - Always backup before making changes
2. **Test in Development** - Run in dev environment first
3. **Read the Script** - Understand what it does
4. **Check Dependencies** - Ensure required tables/columns exist
5. **Update Placeholders** - Replace any template values

### After Running Scripts

1. **Verify Changes** - Check database for expected changes
2. **Test Application** - Ensure features work correctly
3. **Check Logs** - Look for any errors
4. **Document** - Note what you ran and when

### Script Development

When creating new scripts:

1. **Use Descriptive Names**: `action-target.sql` format
2. **Add Comments**: Explain what the script does
3. **Include Safety Checks**: Use `IF NOT EXISTS`, etc.
4. **Test Thoroughly**: Test on dev database first
5. **Document Here**: Add entry to this README

### Naming Convention

- `add-*` - Adding new features/columns
- `create-*` - Creating new tables
- `update-*` - Updating existing data
- `fix-*` - Fixing specific issues
- `setup-*` - Initial setup scripts

## Troubleshooting

### "Table already exists" error
- Normal if feature was already added
- Check if table structure is correct
- Script should use `IF NOT EXISTS` clause

### "Column already exists" error
- Feature was already added
- Verify column has correct type and constraints
- Safe to ignore if script uses `IF NOT EXISTS`

### Permission denied
- Ensure using correct database credentials
- Check RLS policies allow operation
- May need service role key for admin operations

### Foreign key violations
- Verify referenced tables exist
- Check that referenced records exist
- Ensure referential integrity

## Related Documentation

- [Database Migrations](../migrations/README.md) - Historical database changes
- [Database Schema](../docs/architecture/database-schema.md) - Complete schema reference
- [Getting Started](../docs/development/getting-started.md) - Development setup

## See Also

- **Main Schema**: `../supabase-schema.sql` - Complete database schema
- **Migrations**: `../migrations/` - Historical changes
- **Documentation**: `../docs/` - Full documentation

---

**Note**: These are utility scripts for specific operations. For a complete database setup, use the main schema file `supabase-schema.sql` at the project root.
