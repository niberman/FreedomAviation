# Database Migrations Guide

## Overview

This guide covers database migration practices for Freedom Aviation.

## Main Schema File

The primary database schema is in `supabase-schema.sql` at the project root. This file contains:
- All table definitions
- Row Level Security (RLS) policies
- Database triggers
- Indexes
- Sample data

## Running Migrations

### Initial Setup

Run the complete schema in Supabase SQL Editor:
```sql
-- Copy and paste contents of supabase-schema.sql
-- This creates all tables, RLS policies, and triggers
```

### Adding New Features

For specific feature additions, use migration scripts in `scripts/`:

**Google OAuth Support:**
```sql
-- scripts/add-google-oauth-support.sql
-- Updates user profile creation trigger for Google sign-in
```

**Google Calendar Integration:**
```sql
-- scripts/add-google-calendar-integration.sql
-- Creates cfi_schedule and google_calendar_tokens tables
```

## Creating New Migrations

When adding new features:

1. **Update main schema** - Add to `supabase-schema.sql`
2. **Create migration script** - Add script in `scripts/` for incremental updates
3. **Document changes** - Update `docs/architecture/database-schema.md`
4. **Test thoroughly** - Test in development before production

### Migration Script Template

```sql
-- scripts/add-new-feature.sql

-- Add new table
CREATE TABLE IF NOT EXISTS public.new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data"
  ON public.new_table
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_new_table_user_id 
  ON public.new_table(user_id);

-- Add comments
COMMENT ON TABLE public.new_table IS 'Description of what this table stores';
```

## Useful Utility Scripts

### Check Database Setup
```sql
-- scripts/check-setup.sql
-- Verifies database configuration
-- Checks RLS policies
-- Lists all tables
```

### Create Admin User
```sql
-- scripts/setup-admin.sql
-- Promotes a user to admin role
-- Replace email with your email
```

## Best Practices

### 1. Use IF NOT EXISTS
Always use conditional creation to prevent errors:
```sql
CREATE TABLE IF NOT EXISTS ...
CREATE INDEX IF NOT EXISTS ...
```

### 2. Enable RLS on All Tables
```sql
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;
```

### 3. Add Appropriate Policies
Ensure proper access control:
- Owners see only their data
- CFIs see relevant data
- Admins see everything

### 4. Include Timestamps
Every table should have:
```sql
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### 5. Add Indexes
Index frequently queried columns:
```sql
CREATE INDEX IF NOT EXISTS idx_table_column 
  ON public.table_name(column_name);
```

## Column Naming Conventions

Follow these conventions for consistency:

- Use `snake_case` for all names
- Suffix timestamps: `_at` (e.g., `created_at`)
- Suffix dates: `_date` (e.g., `due_date`)
- Suffix foreign keys: `_id` (e.g., `owner_id`)
- Boolean fields: Use descriptive names (`active`, `sync_enabled`)

## Testing Migrations

### Development Testing

1. **Create test Supabase project**
2. **Run migration script**
3. **Verify tables created**
   ```sql
   -- List all tables
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```
4. **Check RLS policies**
   ```sql
   -- View policies for a table
   SELECT * FROM pg_policies WHERE tablename = 'your_table';
   ```
5. **Test with different user roles**

### Rollback Strategy

For problematic migrations:

```sql
-- Drop table if needed
DROP TABLE IF EXISTS public.problematic_table CASCADE;

-- Drop policy if needed
DROP POLICY IF EXISTS "policy_name" ON public.table_name;

-- Re-run corrected migration
```

## Common Issues

### Table Already Exists
- Use `IF NOT EXISTS` in CREATE statements
- Check if table was created manually

### Column Name Mismatches
- Check existing table structure: `\d+ table_name`
- Align script with actual database schema
- Use `ALTER TABLE` to rename if needed

### RLS Blocking Queries
- Verify policies are correct
- Check user role in `user_profiles`
- Use service role key for admin operations

### Foreign Key Violations
- Ensure referenced tables exist first
- Verify referenced records exist
- Check cascade delete settings

## Migration Checklist

Before running a migration:

- [ ] Script uses `IF NOT EXISTS`
- [ ] RLS is enabled on new tables
- [ ] Appropriate policies are defined
- [ ] Indexes are added for performance
- [ ] Timestamps are included
- [ ] Foreign keys are defined
- [ ] Script is tested in development
- [ ] Documentation is updated
- [ ] Backup is taken (for production)

## Maintenance

### Regular Tasks

1. **Review RLS policies** - Ensure they're still appropriate
2. **Check indexes** - Verify performance
3. **Update documentation** - Keep schema docs current
4. **Run check-setup.sql** - Verify configuration
5. **Monitor query performance** - Add indexes as needed

### Schema Updates

When the schema changes significantly:

1. Update `supabase-schema.sql`
2. Update `shared/schema.ts` (TypeScript types)
3. Update `docs/architecture/database-schema.md`
4. Create migration script for existing databases
5. Test thoroughly before deploying

## Support

For migration issues:
- Check Supabase logs in dashboard
- Review `docs/architecture/database-schema.md`
- Run `scripts/check-setup.sql` for diagnostics

---

**Remember**: Always test migrations in development before running in production!

