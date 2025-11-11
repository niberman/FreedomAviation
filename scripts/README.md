# Database Scripts

Utility scripts for database setup, migrations, and maintenance.

## Essential Setup Scripts

### setup-admin.sql
**Purpose**: Promote a user to admin role

**Usage**:
1. Replace `YOUR_EMAIL@example.com` with your email
2. Run in Supabase SQL Editor
3. Verify with `check-setup.sql`

**Example**:
```sql
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'your@email.com';
```

### check-setup.sql
**Purpose**: Verify database configuration

**Usage**:
Run in Supabase SQL Editor to check:
- All tables exist
- RLS policies are configured
- Triggers are active
- User roles are set correctly

## Feature Migration Scripts

### add-google-oauth-support.sql
**Purpose**: Enable Google OAuth sign-in

**What it does**:
- Updates user profile creation trigger
- Handles Google user metadata
- Extracts name from Google's `name` field

**When to use**: When adding Google OAuth to existing database

### add-google-calendar-integration.sql
**Purpose**: Enable CFI Google Calendar sync

**What it does**:
- Creates `cfi_schedule` table
- Creates `google_calendar_tokens` table
- Sets up RLS policies
- Adds necessary indexes

**When to use**: When adding Google Calendar integration

## Column/Table Addition Scripts

### add-aircraft-features.sql
**Purpose**: Add aircraft-specific features

**What it does**: Adds columns for aircraft management features

### add-flight-hours-column.sql
**Purpose**: Add flight hours tracking

**What it does**: Adds columns for tracking flight hours

### add-stripe-fields.sql
**Purpose**: Add Stripe payment fields

**What it does**: Adds columns for Stripe customer IDs and subscription data

### create-cfi-schedule-table.sql
**Purpose**: Create CFI schedule table

**Alternative**: Use `add-google-calendar-integration.sql` instead (more complete)

### create-flight-logs-table.sql
**Purpose**: Create flight logs table

**What it does**: Creates table for tracking flight logs

### create-payable-invoice.sql / create-payable-invoice-simple.sql
**Purpose**: Create invoice tables

**What it does**: Creates tables for invoice management

## Update Scripts

### make-aircraft-optional-in-invoices.sql
**Purpose**: Allow invoices without aircraft

**What it does**: Modifies invoice table to make aircraft_id optional

### update-hangar-amenities.sql
**Purpose**: Update hangar amenities data

**What it does**: Updates hangar locations with amenities information

### update-membership-pricing.sql
**Purpose**: Update membership pricing

**What it does**: Updates pricing for membership tiers

### update-pricing-classes-by-features.sql
**Purpose**: Update pricing based on features

**What it does**: Adjusts pricing classes based on aircraft features

## Utility Scripts

### get-webhook-secret.sh
**Purpose**: Retrieve Stripe webhook secret

**Usage**:
```bash
./scripts/get-webhook-secret.sh
```

### set-env-vars.sh
**Purpose**: Set environment variables

**Usage**:
```bash
./scripts/set-env-vars.sh
```

## Usage Guidelines

### Running SQL Scripts

1. **Open Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy script contents**
4. **Paste and review**
5. **Click "Run"**
6. **Verify results**

### Running Shell Scripts

```bash
# Make executable
chmod +x scripts/script-name.sh

# Run script
./scripts/script-name.sh
```

### Testing Scripts

Always test scripts in development environment first:

1. Create test Supabase project
2. Run script
3. Verify expected changes
4. Test application functionality
5. Apply to production if successful

## Script Development

When creating new scripts:

1. **Use IF NOT EXISTS** for tables and indexes
2. **Include comments** explaining purpose
3. **Document in this README**
4. **Test thoroughly** before committing
5. **Follow naming convention**: `action-target.sql`

### Naming Convention

- `add-*`: Adding new features/columns
- `create-*`: Creating new tables
- `update-*`: Updating existing data
- `fix-*`: Fixing issues (avoid - fix in main schema instead)
- `setup-*`: Initial setup scripts
- `check-*`: Verification scripts

## Best Practices

1. **Backup first** - Always backup before running scripts in production
2. **Test in dev** - Run in development environment first
3. **Read carefully** - Review script before running
4. **Check results** - Verify changes after running
5. **Update docs** - Update this README when adding scripts

## Troubleshooting

### Script fails with "table already exists"
- Normal if table was created previously
- Script should use `IF NOT EXISTS`
- Check if table has correct structure

### Permission denied errors
- Ensure you're using service role key for admin operations
- Check RLS policies allow the operation

### Foreign key violations
- Ensure referenced tables exist first
- Verify referenced records exist

## Maintenance

Periodically review scripts and:
- Remove obsolete scripts
- Update documentation
- Consolidate similar scripts
- Archive old migration scripts

## See Also

- [Database Schema Documentation](../docs/architecture/database-schema.md)
- [Database Migrations Guide](../docs/development/database-migrations.md)
- [Main Schema](../supabase-schema.sql)

---

**Note**: The main database schema is in `supabase-schema.sql` at the project root. Use these scripts for incremental updates or specific features.

