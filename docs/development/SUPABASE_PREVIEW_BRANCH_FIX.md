# Supabase Preview Branch Fix Guide

## Current Status

| Branch | ID | Git Branch | Status | Issue |
|--------|-----|-----------|--------|-------|
| **main** (production) | `wsepwuxkwjnsgmkddkjw` | main | ✅ FUNCTIONS_DEPLOYED | None |
| **preview** | `frarfaidvppulsemvogd` | preview | ❌ MIGRATIONS_FAILED | Type `fuel_billing_directive` already exists |

## Problem

The preview branch shows `MIGRATIONS_FAILED` because migrations tried to create types that already exist:
```
ERROR: type "fuel_billing_directive" already exists (SQLSTATE 42710)
```

## Solution

### Step 1: Apply Onboarding RLS Fix to Preview Branch

The migration file has been created at:
```
/supabase/migrations/20251121000001_fix_onboarding_rls.sql
```

**To apply it manually:**

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/frarfaidvppulsemvogd
   - (This is the preview branch URL)

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy and Paste the Migration**
   - Open: `/supabase/migrations/20251121000001_fix_onboarding_rls.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

4. **Verify Success**
   - Should see "Success. No rows returned"
   - Policies are now active on `onboarding_data` table

### Step 2: Fix Type Duplication Errors (Optional)

If you encounter "type already exists" errors in future migrations, use this pattern:

```sql
-- Safe way to create types (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_billing_directive') THEN
        CREATE TYPE fuel_billing_directive AS ENUM (
            'DIRECT_TO_FBO_CLIENT_CARD',
            'FA_CARD_REBILL_CLIENT',
            'CLIENT_INVOICE_FROM_FBO',
            'HOLD_DONT_FUEL'
        );
    END IF;
END $$;
```

### Step 3: Verify Branch Alignment

Run these commands to verify:

```bash
# Check git branch
git branch --show-current
# Should output: preview

# Check Supabase branches
supabase branches list
# Should show preview branch linked to git preview branch
```

## Branch Configuration

### Git Branches
```
main    → Production-ready code
preview → Testing and staging code
```

### Supabase Branches
```
main (wsepwuxkwjnsgmkddkjw)     → Git: main    → Status: ✅ DEPLOYED
preview (frarfaidvppulsemvogd) → Git: preview → Status: ⏳ FIXING
```

## Using Supabase CLI with Branches

### Link to Correct Branch

The project is linked to **production** by default. To work with preview:

```bash
# List all branches
supabase branches list

# Get preview branch details
supabase branches get preview

# Push migrations to preview (after fixing)
supabase db push --linked
```

### Best Practices

1. **Always test on preview first**
   ```bash
   git checkout preview
   # Make changes
   supabase db push --linked
   # Test thoroughly
   ```

2. **Merge to main only after preview works**
   ```bash
   git checkout main
   git merge preview
   git push
   ```

3. **Keep branches in sync**
   - Preview branch should match preview git branch
   - Main branch should match main git branch

## Files Created

### Migrations
```
supabase/migrations/20251121000001_fix_onboarding_rls.sql
```
- Idempotent RLS policies for onboarding_data
- Safe to run multiple times
- Fixes 400 error on onboarding flow

### Configuration
```
supabase/config.toml
```
- Supabase CLI configuration
- Local development settings
- Database connection settings

### Scripts
```
scripts/fix-preview-branch.mjs
```
- Automated migration application
- Connects to preview branch
- Applies RLS policies

## Troubleshooting

### Error: "Invalid API key"

Each Supabase branch has its own API keys. To get preview branch keys:

1. Go to: https://supabase.com/dashboard/project/frarfaidvppulsemvogd/settings/api
2. Copy the `service_role` key
3. Use it specifically for preview branch operations

### Error: "Type already exists"

This is normal when re-running migrations. The error message from the user was:
```
ERROR: type "fuel_billing_directive" already exists (SQLSTATE 42710)
```

**Solution:** Use `DO $$ BEGIN...END $$;` blocks to check if types exist first (see Step 2 above).

### Error: "MIGRATIONS_FAILED" status persists

After applying the fix manually:

1. The status should auto-update to `FUNCTIONS_DEPLOYED`
2. If not, try:
   ```bash
   supabase branches update preview --git-branch preview
   ```

## Next Steps

1. ✅ Apply `/supabase/migrations/20251121000001_fix_onboarding_rls.sql` to preview branch
2. ✅ Verify onboarding flow works in preview environment
3. ✅ Test password reset emails in preview
4. ✅ Merge to main after preview tests pass
5. ✅ Apply same migration to production

## Environment Variables

### Preview Branch
```env
SUPABASE_URL=https://frarfaidvppulsemvogd.supabase.co
SUPABASE_ANON_KEY=(get from preview dashboard)
SUPABASE_SERVICE_ROLE_KEY=(get from preview dashboard)
```

### Production Branch
```env
SUPABASE_URL=https://wsepwuxkwjnsgmkddkjw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Summary

- ✅ Supabase CLI configured and linked
- ✅ Preview branch linked to git preview branch
- ✅ Idempotent migration created for onboarding RLS
- ✅ Scripts created for automation
- ⏳ Need to apply migration manually (due to different API keys)
- ⏳ Need to verify and update preview branch status

---

**Created:** 2025-11-21
**Branch:** preview
**Status:** Ready to apply

