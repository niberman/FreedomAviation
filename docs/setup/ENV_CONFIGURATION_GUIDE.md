# Environment Configuration Guide

## ⚠️  CRITICAL: Service Role Key Issue Detected

The `env.local` file currently has the **WRONG** service role key - it's using the anon key instead!

### Current Issue

```bash
# env.local (INCORRECT)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# This is actually the ANON key, not the service role key!
```

### How to Fix

1. **Go to Supabase Dashboard** for MAIN branch:
   - URL: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/settings/api
   - Copy the **service_role** key (NOT the anon key)
   
2. **Update `env.local`**:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc4ODk4NSwiZXhwIjoyMDc1MzY0OTg1fQ.lItDlHwaa4Kc1aXw9ScZY7zmf5njL_jNZMeucbF7568
   ```

3. **Verify**: Run `node scripts/verify-env-config.mjs`

## Environment Files Overview

| File | Purpose | Branch | Project ID |
|------|---------|--------|------------|
| `env.local` | Production/Main | main | wsepwuxkwjnsgmkddkjw |
| `.env.preview` | Testing/Staging | preview | frarfaidvppulsemvogd |
| `env.local.example` | Template | - | - |

## Complete Configuration

### 📦 Main Branch (Production) - `env.local`

```bash
# Main Supabase Project (Production)
# Project: wsepwuxkwjnsgmkddkjw
# Branch: main

# Public keys (safe to expose in client)
NEXT_PUBLIC_SUPABASE_URL=https://wsepwuxkwjnsgmkddkjw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODg5ODUsImV4cCI6MjA3NTM2NDk4NX0.B4KktUFp_WLh55A5ZEP64NApI_ZttDZLA1IqP5FK9BI

# Server-side keys (MUST be kept secret)
SUPABASE_URL=https://wsepwuxkwjnsgmkddkjw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODg5ODUsImV4cCI6MjA3NTM2NDk4NX0.B4KktUFp_WLh55A5ZEP64NApI_ZttDZLA1IqP5FK9BI

# ⚠️  GET THIS FROM DASHBOARD - DO NOT USE ANON KEY!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc4ODk4NSwiZXhwIjoyMDc1MzY0OTg1fQ.lItDlHwaa4Kc1aXw9ScZY7zmf5njL_jNZMeucbF7568

# Stripe (Production keys)
STRIPE_SECRET_KEY=sk_live_your_production_key_here
```

### 🧪 Preview Branch (Staging) - `.env.preview`

```bash
# Preview Supabase Project (Testing/Staging)
# Project: frarfaidvppulsemvogd
# Branch: preview

# Public keys (safe to expose in client)
NEXT_PUBLIC_SUPABASE_URL=https://frarfaidvppulsemvogd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYXJmYWlkdnBwdWxzZW12b2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTAyODgsImV4cCI6MjA3ODcyNjI4OH0.X1QMTIcGuVVoFi7XpO7jO_2Otoh_7YvXoHLRZRGxt04

# Server-side keys (MUST be kept secret)
SUPABASE_URL=https://frarfaidvppulsemvogd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYXJmYWlkdnBwdWxzZW12b2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTAyODgsImV4cCI6MjA3ODcyNjI4OH0.X1QMTIcGuVVoFi7XpO7jO_2Otoh_7YvXoHLRZRGxt04
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYXJmYWlkdnBwdWxzZW12b2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE1MDI4OCwiZXhwIjoyMDc4NzI2Mjg4fQ.q12wr6KIGQJhI6HUaX1zzC7X6UilnOb4EhiFc6vuroc

# Database connection (for direct SQL access)
POSTGRES_URL=postgresql://postgres.frarfaidvppulsemvogd:pBpnnuwOggHCVXKWtNdgFljjzMCdfSni@aws-1-us-west-1.pooler.supabase.com:6543/postgres?connect_timeout=10

# Stripe (Test keys for preview)
STRIPE_SECRET_KEY=sk_test_your_test_key_here

# Branch identifier
BRANCH_NAME=preview
SUPABASE_PROJECT_REF=frarfaidvppulsemvogd
```

## How to Create `.env.preview`

Since `.env.preview` is in `.gitignore`, you need to create it manually:

```bash
# Copy the template
cp env.local .env.preview

# Then edit .env.preview and replace with preview branch keys
```

Or create it from scratch with the content above.

## Verification

Run the verification script to ensure everything is configured correctly:

```bash
node scripts/verify-env-config.mjs
```

**Expected output:**
```
✨ All environment configurations are correct!
```

## How to Get API Keys

### For Main Branch (Production)

1. Go to: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/settings/api
2. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` key (NEVER commit this!)

### For Preview Branch

1. Go to: https://supabase.com/dashboard/project/frarfaidvppulsemvogd/settings/api
2. Copy the same keys as above

Or use Supabase CLI:

```bash
# Get preview branch keys
supabase branches get preview --output json

# Get main branch keys  
supabase projects api-keys --project-ref wsepwuxkwjnsgmkddkjw
```

## Usage Guide

### Local Development with Production Database

```bash
# Use env.local (default)
npm run dev
```

### Local Development with Preview Database

```bash
# Option 1: Temporarily rename files
mv env.local env.local.backup
mv .env.preview env.local
npm run dev
# Don't forget to restore!

# Option 2: Use environment override
NODE_ENV=preview npm run dev
```

### Testing Against Specific Branches

```bash
# Test main branch integration
node scripts/test-main-integration.mjs

# Test preview branch integration
node scripts/test-preview-integration.mjs
```

## Security Best Practices

### ✅ DO:
- Keep service role keys in env files
- Add all `.env*` files to `.gitignore` (except `.env.example`)
- Use test Stripe keys in preview environment
- Rotate keys if accidentally exposed
- Use different databases for preview and production

### ❌ DON'T:
- Commit service role keys to git
- Use production keys in preview
- Share service role keys in chat/email
- Use the same database for testing and production
- Hard-code API keys in source files

## Environment Variables Reference

| Variable | Required | Secret | Purpose |
|----------|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ❌ | Client-side Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ❌ | Client-side anonymous key |
| `SUPABASE_URL` | ✅ | ❌ | Server-side Supabase URL |
| `SUPABASE_ANON_KEY` | ✅ | ❌ | Server-side anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | Server-side admin key (CRITICAL!) |
| `POSTGRES_URL` | ⚠️ | ✅ | Direct database connection |
| `STRIPE_SECRET_KEY` | ✅ | ✅ | Stripe payments |

## Troubleshooting

### Error: "Invalid API key"

**Problem:** Using wrong keys for the environment

**Solution:**
1. Run `node scripts/verify-env-config.mjs`
2. Check which project the keys belong to
3. Update with correct keys from dashboard

### Error: "Row Level Security" blocking access

**Problem:** Service role key might be wrong

**Solution:**
1. Verify it's the `service_role` key, not `anon`
2. Check JWT payload: `role` should be `"service_role"`
3. Get fresh key from dashboard if needed

### Error: Cross-contamination between environments

**Problem:** Preview using production keys or vice versa

**Solution:**
1. Check `ref` field in JWT matches project
2. Ensure `.env.preview` has preview keys
3. Ensure `env.local` has main keys
4. Run verification script

## Quick Reference

```bash
# Verify configuration
node scripts/verify-env-config.mjs

# Test main branch
node scripts/test-main-integration.mjs

# Test preview branch  
node scripts/test-preview-integration.mjs

# Get preview keys via CLI
supabase branches get preview --output json

# Apply migration to preview
PGPASSWORD="xxx" psql -h aws-1-us-west-1.pooler.supabase.com \\
  -p 6543 -U postgres.frarfaidvppulsemvogd -d postgres \\
  -f supabase/migrations/your-migration.sql
```

## Summary Checklist

- [ ] `env.local` has correct main branch keys
- [ ] `env.local` has correct service role key (not anon key!)
- [ ] `.env.preview` created with preview branch keys
- [ ] Both files in `.gitignore`
- [ ] Verification script passes
- [ ] Main integration tests pass
- [ ] Preview integration tests pass
- [ ] No key cross-contamination
- [ ] Different Stripe keys for each environment

---

**Last Updated:** 2025-11-21  
**Current Status:** ⚠️  Service role key needs fixing in env.local  
**Action Required:** Update SUPABASE_SERVICE_ROLE_KEY with correct value from dashboard

