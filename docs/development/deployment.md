# Deployment Guide

Complete guide for deploying Freedom Aviation to production and managing deployments.

## Table of Contents

- [Deployment Overview](#deployment-overview)
- [Environment Setup](#environment-setup)
- [Database Migrations](#database-migrations)
- [Vercel Deployment](#vercel-deployment)
- [Post-Deployment Checks](#post-deployment-checks)
- [Troubleshooting](#troubleshooting)

---

## Deployment Overview

### Hosting Platform

**Vercel** - Frontend and API hosting

### Deployment Strategy

- **`main` branch** → Production ([freedomaviationco.com](https://freedomaviationco.com))
- **`preview` branch** → Preview/Staging environment
- **Feature branches** → Auto-preview deployments

### Automatic Deployments

Vercel automatically deploys when you push to:
- `main` → Production
- `preview` → Preview environment
- Any branch → Preview URL

---

## Environment Setup

### Required Environment Variables

Configure in **Vercel Dashboard → Project Settings → Environment Variables**:

#### Supabase (Required)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Stripe (Required for Payments)
```env
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Email (Required for Notifications)
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=re_...
```

#### Google (Optional - for OAuth & Calendar)
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

#### Site Configuration
```env
SITE_URL=https://www.freedomaviationco.com
FRONTEND_URL=https://www.freedomaviationco.com
```

### Setting Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings → Environment Variables**
4. Add each variable:
   - **Name**: Variable name (e.g., `VITE_SUPABASE_URL`)
   - **Value**: The value
   - **Environment**: Select `Production`, `Preview`, and `Development` as needed
5. Click **Save**

### Environment-Specific Variables

You can set different values for different environments:
- **Production**: Production API keys
- **Preview**: Staging/test API keys
- **Development**: Local development keys

---

## Database Migrations

### Before Deploying Code Changes

If your code changes require database schema updates:

#### 1. Test Migration in Development

```bash
# Run migration locally or on staging database first
psql $DEV_DATABASE_URL -f migrations/your-migration.sql
```

#### 2. Apply to Production Database

**Option A: Supabase SQL Editor (Recommended)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your production project
3. Navigate to **SQL Editor**
4. Copy/paste migration file contents
5. Review carefully
6. Click **Run**
7. Verify success

**Option B: Command Line**

```bash
# Using psql (if you have direct access)
psql $PRODUCTION_DATABASE_URL -f migrations/your-migration.sql
```

#### 3. Deploy Code

After database is migrated, deploy the code:

```bash
git push origin main
```

### Migration Checklist

- [ ] Backup database before migration
- [ ] Test migration in development/staging
- [ ] Review migration SQL for safety
- [ ] Run migration in production
- [ ] Verify migration succeeded
- [ ] Deploy code changes
- [ ] Test functionality in production

### Common Migrations

#### Deploy Invoice Functions
```bash
# Creates create_instruction_invoice and finalize_invoice functions
# Run in Supabase SQL Editor
migrations/deploy_invoice_functions.sql
```

#### Update Hangar Pricing
```bash
# Updates pricing_locations table
migrations/update_hangar_pricing.sql
```

---

## Vercel Deployment

### Deploying to Production

**Method 1: Git Push (Recommended)**

```bash
# Merge to main and push
git checkout main
git merge your-feature-branch
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build the application
3. Run tests (if configured)
4. Deploy to production
5. Update DNS

**Method 2: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

**Method 3: Vercel Dashboard**

1. Go to Vercel Dashboard → Deployments
2. Click **"..."** on a successful preview deployment
3. Click **"Promote to Production"**

### Build Configuration

Vercel uses these settings (configured in `vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/client",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### Custom Domain Setup

1. Go to Vercel → Project Settings → Domains
2. Add domain: `www.freedomaviationco.com`
3. Add domain: `freedomaviationco.com` (apex)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (~1 hour)

### Preview Deployments

Every push to a branch creates a preview URL:

```
https://freedom-aviation-{branch-name}-{team}.vercel.app
```

Preview deployments are useful for:
- Testing features before merging
- Sharing work with stakeholders
- QA testing

---

## Post-Deployment Checks

### Immediate Checks (< 5 minutes)

1. **Site loads**
   - Visit https://www.freedomaviationco.com
   - Check homepage loads without errors
   - Check navigation works

2. **Authentication works**
   - Try logging in
   - Try signing up
   - Check dashboard access

3. **Console errors**
   - Open browser DevTools (F12)
   - Check Console tab
   - Should be no critical errors

4. **API connectivity**
   - Navigate to staff dashboard
   - Check data loads
   - Verify no 404 or 500 errors

### Thorough Checks (15-30 minutes)

1. **Core user flows**
   - Owner: Create service request
   - Staff: View and assign service request
   - CFI: Create instruction invoice
   - Admin: Access admin dashboard

2. **Database operations**
   - Create test records
   - Update test records
   - Verify RLS policies work
   - Check data appears correctly

3. **Email notifications**
   - Invite new user
   - Verify email received
   - Check email formatting

4. **Payment processing** (if applicable)
   - Create test invoice
   - Process test payment
   - Verify webhook handling

### Monitoring

**Vercel Analytics**
- Visit Vercel Dashboard → Analytics
- Check page views, errors, performance

**Supabase Logs**
- Visit Supabase → Database → Logs
- Check for errors or slow queries

**Browser Error Tracking**
- Monitor browser console errors
- Check Sentry (if configured)

---

## Troubleshooting

### Deployment Fails

**Problem**: Build fails in Vercel

**Check**:
1. Build logs in Vercel Dashboard
2. TypeScript errors: `npm run check`
3. Build command: `npm run build`
4. Dependencies: `npm install`

**Common Causes**:
- TypeScript errors
- Missing dependencies
- Environment variable issues
- Build timeout

**Solutions**:
```bash
# Test build locally
npm run build

# Check TypeScript
npm run check

# Clear cache and rebuild
npm run clean
npm install
npm run build
```

### Environment Variables Not Working

**Problem**: App can't access environment variables

**Check**:
1. Vercel Dashboard → Settings → Environment Variables
2. Variable names have correct prefix (`VITE_` for frontend)
3. Variables assigned to correct environment
4. Redeploy after adding variables

**Note**: Variables are embedded at build time. After changing variables:
1. Go to Vercel Dashboard → Deployments
2. Find latest deployment
3. Click **"..."** → **"Redeploy"**

### Database Connection Errors

**Problem**: App can't connect to Supabase

**Check**:
1. `VITE_SUPABASE_URL` is correct
2. `VITE_SUPABASE_ANON_KEY` is correct
3. Supabase project is active
4. RLS policies allow access

**Test Connection**:
```javascript
// In browser console
console.log(import.meta.env.VITE_SUPABASE_URL);
```

### Vercel Not Detecting Git Pushes

**Problem**: Pushing to GitHub but Vercel doesn't deploy

**Solutions**:

1. **Check Vercel Git Integration**
   - Vercel Dashboard → Project Settings → Git
   - Verify repository connected
   - Check production branch setting

2. **Verify GitHub Webhook**
   - GitHub → Repository → Settings → Webhooks
   - Find Vercel webhook
   - Check recent deliveries
   - If failing, reconnect in Vercel

3. **Manual Trigger**
   - Vercel Dashboard → Deployments
   - Click **"Redeploy"** on latest build

4. **Reconnect Repository**
   - Vercel Dashboard → Project Settings → Git
   - Click **"Disconnect"**
   - Click **"Connect"** and reauthorize

### 404 Errors After Deployment

**Problem**: Routes return 404 in production

**Cause**: SPA routing not configured

**Solution**: Verify `vercel.json` has:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### API Routes Not Working

**Problem**: API endpoints return 404 or 500

**Check**:
1. `server/routes.ts` configured correctly
2. `api/index.ts` exports handler
3. Vercel config has API routes
4. Environment variables available

**Vercel Config**:
```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

### Stripe Webhooks Failing

**Problem**: Stripe events not processing

**Check**:
1. Webhook endpoint configured in Stripe
2. `STRIPE_WEBHOOK_SECRET` in Vercel
3. Webhook signature verification

**Stripe Dashboard**:
1. Go to Developers → Webhooks
2. Find your production endpoint
3. Check recent events
4. Verify events succeed

**Endpoint URL**:
```
https://www.freedomaviationco.com/api/webhooks/stripe
```

---

## Rollback Procedure

If a deployment causes issues:

### Option 1: Instant Rollback (Vercel Dashboard)

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click **"..."** → **"Promote to Production"**
4. Confirm rollback

**Recovery time**: < 1 minute

### Option 2: Git Revert

```bash
# Revert last commit
git revert HEAD

# Push to trigger new deployment
git push origin main
```

**Recovery time**: 2-5 minutes (build time)

### Option 3: Redeploy Previous Commit

```bash
# Find last good commit
git log --oneline -10

# Reset to that commit
git reset --hard <commit-hash>

# Force push (be careful!)
git push --force origin main
```

**⚠️ Warning**: Force push affects team members

---

## Deployment Checklist

### Pre-Deployment

- [ ] Test changes locally
- [ ] Run TypeScript check: `npm run check`
- [ ] Run build: `npm run build`
- [ ] Test in preview deployment
- [ ] Review changes with stakeholders
- [ ] Backup production database (if schema changes)
- [ ] Run database migrations (if needed)

### Deployment

- [ ] Merge to `main` branch
- [ ] Push to GitHub
- [ ] Monitor Vercel build logs
- [ ] Wait for deployment to complete

### Post-Deployment

- [ ] Verify site loads
- [ ] Test authentication
- [ ] Check core user flows
- [ ] Monitor error logs
- [ ] Check Vercel Analytics
- [ ] Notify team of deployment

---

## Best Practices

### 1. Always Use Preview Deployments

Test in preview before promoting to production:
```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
# Test preview URL before merging
```

### 2. Database Migrations First

Always run database migrations before deploying code that requires them:
1. Run migration
2. Verify it succeeded
3. Deploy code

### 3. Monitor After Deployment

Watch for issues in the first 30 minutes:
- Error rates
- Performance metrics
- User reports

### 4. Have a Rollback Plan

Know how to quickly rollback if issues occur:
- Keep Vercel Dashboard open
- Know the last good commit hash
- Have database backup

### 5. Communicate Deployments

Let team know when deploying:
- Post in team chat
- Note any breaking changes
- Document what changed

---

## Related Documentation

- [Getting Started](getting-started.md) - Development setup
- [Database Migrations](database-migrations.md) - Migration guide
- [Troubleshooting](troubleshooting.md) - Common issues

---

**Last Updated**: November 2025  
**Maintained By**: Development Team

