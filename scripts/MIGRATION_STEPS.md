# Migration Steps: Consolidate to user_role Enum

## Current State
You have two enums (`app_role` and `user_role`) with the same values. We're consolidating to use only `user_role`.

## Step-by-Step Migration

### 1. Run the Migration Script
Execute the migration script in Supabase SQL Editor:

```bash
# Run this script
scripts/migrate-to-user-role.sql
```

This will:
- Migrate any columns using `app_role` to use `user_role`
- Drop the `app_role` enum
- Verify the migration

### 2. Verify Results
After running the script, you should see:
- ✅ Only `user_role` enum exists
- ✅ Values: `owner`, `staff`, `cfi`, `admin`, `ops`, `founder`
- ✅ No tables reference `app_role`

### 3. Update Application Code (Already Done)
The TypeScript types have already been updated:
- ✅ `client/src/lib/types/database.ts` - Uses `user_role` type
- ✅ `client/src/lib/roles.ts` - Includes `ops` and `founder`

## What's New

### New Roles
1. **ops** - Operations staff who receive service request notifications
2. **founder** - Super-admin with all permissions and customizable notifications

### New Features
- Email notifications for service requests (to ops)
- Email notifications for flight instruction requests (to CFIs)
- Notification preferences UI for founders
- Instruction request form and management

## Assign Roles to Users

After migration, assign roles:

```sql
-- Make someone an ops user
UPDATE public.user_profiles 
SET role = 'ops' 
WHERE email = 'ops@freedomaviationco.com';

-- Make someone a founder
UPDATE public.user_profiles 
SET role = 'founder' 
WHERE email = 'founder@freedomaviationco.com';

-- Make someone a CFI
UPDATE public.user_profiles 
SET role = 'cfi' 
WHERE email = 'instructor@freedomaviationco.com';
```

## Next Steps

1. ✅ Run `scripts/migrate-to-user-role.sql`
2. Run `scripts/add-email-triggers.sql` to set up email notifications
3. Set up email environment variables (see `docs/ROLES_AND_NOTIFICATIONS.md`)
4. Test the new notification system

## Troubleshooting

### If migration fails
```sql
-- Check which enum is actually being used
SELECT table_name, column_name, udt_name
FROM information_schema.columns 
WHERE udt_name IN ('app_role', 'user_role');

-- Manually migrate if needed
ALTER TABLE public.user_profiles 
ALTER COLUMN role TYPE user_role 
USING role::text::user_role;

-- Then drop app_role
DROP TYPE app_role;
```

### Verify final state
```sql
-- Should only show user_role
SELECT typname FROM pg_type WHERE typname IN ('user_role', 'app_role');

-- Should show all 6 values
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
```

