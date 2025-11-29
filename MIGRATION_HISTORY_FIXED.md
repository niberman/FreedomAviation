# Migration History Fixed ✅

## Problem Solved

The Supabase preview branch had a migration history mismatch that prevented `supabase db push` from working. This has been completely resolved.

---

## The Issue

```
Remote migration versions not found in local migrations directory.

Skipping migration complete_preview_setup.sql... 
(file name must match pattern "<timestamp>_name.sql")

Skipping migration preview_minimal_setup.sql... 
(file name must match pattern "<timestamp>_name.sql")
```

**Root Causes:**
1. Preview branch had 21 old migration records from October that don't exist locally
2. Our migration files didn't follow Supabase's naming convention
3. Migrations were applied manually but not recorded in history table

---

## What Was Fixed

### 1. Cleaned Migration History ✅

**Removed 21 orphaned migrations:**
```sql
DELETE FROM supabase_migrations.schema_migrations WHERE version IN (
  '20251006222521', '20251007001332', '20251007150000', ... (18 more)
);
-- Result: DELETE 21
```

### 2. Renamed Migrations to Proper Format ✅

**Old (WRONG):**
- `preview_minimal_setup.sql` ❌
- `complete_preview_setup.sql` ❌

**New (CORRECT):**
- `20251121170000_preview_onboarding_setup.sql` ✅
- `20251121170001_complete_onboarding_setup.sql` ✅

**Pattern:** `<timestamp>_descriptive_name.sql`

### 3. Recorded Applied Migrations ✅

Added all migrations to history table:
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES
('20251121000000', 'create_onboarding_data_table', ARRAY['-- Applied manually']),
('20251121000001', 'fix_onboarding_rls', ARRAY['-- Applied manually']),
('20251121000002', 'sync_all_tables', ARRAY['-- Applied manually']),
('20251121170000', 'preview_onboarding_setup', ARRAY['-- Applied manually']),
('20251121170001', 'complete_onboarding_setup', ARRAY['-- Applied manually']);
-- Result: INSERT 0 5
```

---

## Verification

### Migration History Check

```bash
$ node scripts/fix-migration-history.mjs

Found 5 remote migrations:
  • 20251121000000
  • 20251121000001
  • 20251121000002
  • 20251121170000
  • 20251121170001

Found 5 local migrations:
  • 20251121000000
  • 20251121000001
  • 20251121000002
  • 20251121170000
  • 20251121170001

✅ Local and remote migrations are in sync!
```

### Current Migration Files

```
supabase/migrations/
├── 20251121000000_create_onboarding_data_table.sql
├── 20251121000001_fix_onboarding_rls.sql
├── 20251121000002_sync_all_tables.sql
├── 20251121170000_preview_onboarding_setup.sql
└── 20251121170001_complete_onboarding_setup.sql
```

All files follow the `<timestamp>_name.sql` pattern ✅

---

## New Tool Created

### `scripts/fix-migration-history.mjs`

Diagnostic tool that:
- ✅ Lists all remote migrations
- ✅ Lists all local migrations
- ✅ Identifies mismatches
- ✅ Generates repair commands
- ✅ Provides solutions

**Usage:**
```bash
node scripts/fix-migration-history.mjs
```

---

## Current Status

| Component | Status | Details |
|-----------|--------|---------|
| Migration Files | ✅ Fixed | All properly named |
| Remote History | ✅ Clean | 5 migrations recorded |
| Local History | ✅ Synced | Matches remote exactly |
| Database State | ✅ Working | Tables and RLS policies active |
| Supabase CLI | ✅ Ready | Can now use `db push` and `db pull` |

---

## How to Use Supabase CLI Now

### Push New Migrations

```bash
# Create a new migration file with proper naming
supabase migration new your_migration_name

# Edit the file: supabase/migrations/20251121XXXXXX_your_migration_name.sql

# Push to preview branch
supabase db push --db-url "postgresql://postgres.frarfaidvppulsemvogd:pBpnnuwOggHCVXKWtNdgFljjzMCdfSni@aws-1-us-west-1.pooler.supabase.com:6543/postgres"

# Or link to preview and push
supabase link --project-ref frarfaidvppulsemvogd
supabase db push
```

### Pull from Remote

```bash
# Pull schema changes from preview branch
supabase db pull

# This will create a new migration file with the changes
```

### Create New Migration

```bash
# Generate timestamped migration file
supabase migration new add_new_feature

# File created: supabase/migrations/20251121XXXXXX_add_new_feature.sql
```

---

## Migration Naming Convention

### ✅ CORRECT Format

```
<YYYYMMDDHHMMSS>_descriptive_name.sql

Examples:
- 20251121170000_preview_onboarding_setup.sql
- 20251121000001_fix_onboarding_rls.sql
- 20251122120000_add_user_preferences.sql
```

### ❌ WRONG Format

```
Examples:
- preview_setup.sql                    (no timestamp)
- migration.sql                        (not descriptive)
- 2025-11-21-setup.sql                (wrong timestamp format)
- 20251121_setup                      (no .sql extension)
```

---

## Database State (Preview Branch)

### Tables Created ✅

- `public.onboarding_data` - Fully configured with RLS
- `public.user_profiles` - (if it exists from main branch)

### RLS Policies Active ✅

**onboarding_data table:**
1. Users can view their own onboarding data (SELECT)
2. Users can insert their own onboarding data (INSERT)
3. Users can update their own onboarding data (UPDATE)
4. Users can delete their own onboarding data (DELETE)

### Constraints ✅

- Primary key on `id`
- Unique constraint on `user_id`
- Foreign key to `auth.users(id)` with CASCADE delete

---

## Workflow: Preview → Main

Now that migrations are working, here's the proper workflow:

### 1. Develop on Preview

```bash
git checkout preview

# Create migration
supabase migration new my_feature

# Edit supabase/migrations/20251121XXXXXX_my_feature.sql

# Apply to preview
supabase db push --db-url "postgresql://..."

# Test
node scripts/test-preview-integration.mjs
```

### 2. Verify

```bash
# Check migration was recorded
node scripts/fix-migration-history.mjs

# Should show new migration in both local and remote
```

### 3. Merge to Main

```bash
git checkout main
git merge preview
git push origin main
```

### 4. Apply to Production

```bash
# Get main branch connection
supabase branches get main --output json

# Apply same migration
PGPASSWORD="main-password" psql -h main-host -p 6543 \
  -U postgres.wsepwuxkwjnsgmkddkjw -d postgres \
  -f supabase/migrations/20251121XXXXXX_my_feature.sql

# Or use Supabase CLI
supabase link --project-ref wsepwuxkwjnsgmkddkjw
supabase db push
```

---

## Troubleshooting

### Error: "Remote migration versions not found"

**Solution:** Run the diagnostic tool
```bash
node scripts/fix-migration-history.mjs
```

Follow the suggested commands to sync.

### Error: "file name must match pattern"

**Solution:** Rename your migration files
```bash
mv my_migration.sql 20251121120000_my_migration.sql
```

### Error: "Migration already exists"

**Solution:** Check if already applied
```sql
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version = '20251121XXXXXX';
```

If it exists, skip or create a new migration with a later timestamp.

---

## Summary

✅ **Migration history cleaned** - Removed 21 orphaned records  
✅ **Files renamed properly** - All follow `<timestamp>_name.sql` pattern  
✅ **History synchronized** - Local and remote match exactly  
✅ **Database working** - All tables and policies active  
✅ **CLI ready** - Can now use `supabase db push/pull`  
✅ **Tools created** - Diagnostic script for future issues  

---

## Files Changed

```
supabase/migrations/
  20251121170000_preview_onboarding_setup.sql    (renamed from preview_minimal_setup.sql)
  20251121170001_complete_onboarding_setup.sql   (renamed from complete_preview_setup.sql)

scripts/
  fix-migration-history.mjs                      (new diagnostic tool)
```

---

**Status:** ✅ RESOLVED  
**Branch:** preview  
**Commit:** 38115e4  
**Date:** 2025-11-21  
**Next:** Ready to create new migrations with `supabase migration new`

