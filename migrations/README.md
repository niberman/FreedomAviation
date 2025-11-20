# Database Migrations

This directory contains SQL migration scripts for the Freedom Aviation database. These migrations handle schema changes, data updates, and fixes that have been applied to the production database.

## Overview

Migrations are SQL scripts that modify the database schema or data. They are organized in this directory and should be applied carefully to avoid data loss or corruption.

## Migration Types

### Schema Migrations
Scripts that modify database structure:
- `CREATE_FLIGHT_LOGS_TABLE.sql` - Flight logging system
- `CREATE_MAINTENANCE_TABLE.sql` - Maintenance tracking
- `create_notifications_table.sql` - Notification system
- `cleanup_aircraft_duplicate_columns.sql` - Remove duplicate columns
- `cleanup_unused_tables.sql` - Remove obsolete tables

### Role & Permission Migrations
Scripts that manage user roles and access control:
- `add_user_roles.sql` - Add role system to user profiles
- `add_founder_to_all_policies_SAFE.sql` - Grant founder access
- `add_staff_view_permissions.sql` - Staff viewing permissions
- `fix_client_roles.sql` - Fix client role assignments
- `resolve_user_roles_duplication.sql` - Remove duplicate roles
- `fix_role_whitespace.sql` - Clean role data

### RLS (Row Level Security) Migrations
Scripts that update database security policies:
- `fix_rls_policies_EMERGENCY.sql` - Emergency RLS fixes
- `FIX_SERVICE_REQUESTS_RLS.sql` - Service request access policies
- `safe_schema_setup.sql` - Safe schema initialization with RLS

### Feature Migrations
Scripts that add or modify features:
- `deploy_invoice_functions.sql` - Invoice management functions
- `fix_invoice_aircraft_optional.sql` - Make aircraft optional in invoices
- `update_hangar_pricing.sql` - Update hangar pricing structure

### Diagnostic Scripts
Scripts for troubleshooting:
- `diagnose_client_visibility.sql` - Debug client access issues
- `EMERGENCY_FIX_RECURSION_V2.sql` - Fix recursive policy issues

### Trigger Migrations
Scripts that manage database triggers:
- `fix_user_creation_trigger.sql` - Fix user profile creation

## How to Use Migrations

### Running a Migration

1. **Open Supabase SQL Editor**
   - Navigate to: https://supabase.com/dashboard/project/[your-project-id]/sql

2. **Open the Migration File**
   - Open the desired `.sql` file from this directory

3. **Review the Script**
   - Read through the SQL to understand what it does
   - Check for any placeholder values that need updating

4. **Execute the Migration**
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run"
   - Wait for "Success" message

5. **Verify the Changes**
   - Test the affected functionality in the application
   - Check that data is correct
   - Verify RLS policies are working as expected

### Best Practices

1. **Backup First** - Always backup your database before running migrations
2. **Test in Development** - Run migrations in a test environment first
3. **Read Carefully** - Understand what the migration does before running it
4. **One at a Time** - Run migrations one at a time, not all at once
5. **Verify Results** - Check that the migration succeeded and didn't break anything
6. **Document** - Update this README if you create new migrations

## Creating New Migrations

When you need to create a new migration:

1. **Name the File Descriptively**
   ```
   verb_target_description.sql
   Examples:
   - add_subscription_status.sql
   - fix_user_profiles_rls.sql
   - update_aircraft_pricing.sql
   ```

2. **Include Comments**
   ```sql
   -- Migration: Add subscription status tracking
   -- Date: 2024-01-15
   -- Purpose: Track active/inactive subscription status
   -- Dependencies: Requires user_profiles table
   
   -- Your SQL here...
   ```

3. **Use Safe Patterns**
   ```sql
   -- Check if column exists before adding
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT FROM information_schema.columns 
       WHERE table_name = 'users' AND column_name = 'new_column'
     ) THEN
       ALTER TABLE users ADD COLUMN new_column TEXT;
     END IF;
   END $$;
   ```

4. **Test Thoroughly**
   - Test on development database
   - Verify no data loss
   - Check RLS policies still work
   - Test application functionality

5. **Document in this README**
   - Add to the appropriate section above
   - Note any dependencies
   - Document expected outcome

## Troubleshooting

### Migration Failed

If a migration fails:
1. Check the error message carefully
2. Look for syntax errors or typos
3. Verify all referenced tables/columns exist
4. Check if the migration was already applied
5. Try running in smaller chunks

### RLS Policy Issues

If you're having access issues after a migration:
1. Check RLS policies are enabled: `SELECT * FROM pg_tables WHERE tablename = 'your_table'`
2. Verify your user's role: `SELECT role FROM user_profiles WHERE email = 'your@email.com'`
3. Test policies with: `SET ROLE authenticated;` in SQL Editor

### Data Corruption

If a migration corrupts data:
1. Restore from backup immediately
2. Review the migration script
3. Fix the issue
4. Test thoroughly before re-running

## Migration History

For a complete history of schema changes, see:
- Main schema: `../supabase-schema.sql`
- Utility scripts: `../scripts/`
- Documentation: `../docs/architecture/database-schema.md`

## Related Documentation

- [Database Schema](../docs/architecture/database-schema.md) - Complete schema documentation
- [Setup Scripts](../scripts/README.md) - Utility scripts for setup and maintenance
- [Getting Started](../docs/development/getting-started.md) - Development setup guide

---

**Important**: These migrations represent historical changes. For a fresh database setup, use `../supabase-schema.sql` instead of running all migrations.
