# Troubleshooting Guide

Common issues and solutions for Freedom Aviation development and deployment.

## Table of Contents

- [Development Issues](#development-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)

---

## Development Issues

### Cannot Start Dev Server

**Problem**: `npm run dev` fails

**Common Causes & Solutions**:

#### Port Already in Use
```bash
# Error: Port 5000 already in use

# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

#### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Check for type errors
npm run check

# If types are outdated
npm update @types/*
```

### Build Fails Locally

**Problem**: `npm run build` fails

**Solutions**:

```bash
# 1. Check TypeScript compilation
npx tsc --noEmit

# 2. Clear dist folder
rm -rf dist

# 3. Reinstall dependencies
rm -rf node_modules
npm install

# 4. Try build again
npm run build
```

### Hot Module Reload Not Working

**Problem**: Changes don't reflect in browser

**Solutions**:

1. **Hard refresh**: Cmd/Ctrl + Shift + R
2. **Clear cache**: DevTools → Network → "Disable cache"
3. **Restart dev server**: Stop and run `npm run dev` again
4. **Check file watching**:
   ```bash
   # Increase file watch limit (Mac/Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### Import Errors

**Problem**: Module not found errors

**Check**:

1. **File exists** at the path you're importing
2. **Extension correct** (.ts, .tsx, .js, .jsx)
3. **Case sensitivity** - paths are case-sensitive
4. **Relative vs absolute** paths

**Examples**:
```typescript
// ✅ Correct
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

// ❌ Wrong
import { Button } from "components/ui/button";  // Missing @/
import { supabase } from "./lib/supabase";      // Should be @/lib
```

---

## Database Issues

### Cannot Connect to Supabase

**Problem**: Database connection fails

**Check**:

1. **Environment variables set**:
   ```bash
   # Should output your Supabase URL
   echo $VITE_SUPABASE_URL
   ```

2. **Supabase project active**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Check project status
   - Verify not paused

3. **Network connectivity**:
   ```bash
   # Test connection
   curl https://your-project.supabase.co/rest/v1/
   ```

4. **RLS policies**:
   - Some policies may be blocking access
   - Check Supabase Dashboard → Authentication → Policies

### RLS Policy Errors

**Problem**: "Row Level Security policy violation"

**Common Causes**:

1. **User not authenticated**
2. **Policy doesn't allow operation**
3. **Role mismatch**

**Debug**:

```sql
-- Check user's role
SELECT id, email, role FROM user_profiles 
WHERE id = auth.uid();

-- Check RLS policies on table
SELECT * FROM pg_policies 
WHERE tablename = 'your_table';

-- Test policy (in SQL Editor)
SET ROLE authenticated;
SELECT * FROM your_table;
```

**Common Fixes**:

```sql
-- Add policy for authenticated users
CREATE POLICY "authenticated_read" ON your_table
  FOR SELECT
  TO authenticated
  USING (true);

-- Add policy for owners
CREATE POLICY "owners_own_data" ON your_table
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());
```

### Migration Fails

**Problem**: SQL migration returns errors

**Common Errors**:

#### "Column already exists"
```sql
-- Solution: Use IF NOT EXISTS
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS column_name TEXT;
```

#### "Table does not exist"
```sql
-- Check table exists first
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'your_table'
  ) THEN
    -- Your ALTER statement here
  END IF;
END $$;
```

#### "Relation depends on view"
```sql
-- Drop view first, then recreate after column change
DROP VIEW IF EXISTS v_your_view;
ALTER TABLE your_table ADD COLUMN new_col TEXT;
CREATE VIEW v_your_view AS ...;
```

### User Creation Fails

**Problem**: Cannot create users

**Check**:

1. **Email already exists**:
   ```sql
   SELECT * FROM auth.users WHERE email = 'user@example.com';
   ```

2. **Trigger not firing**:
   ```sql
   -- Check trigger exists
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

3. **RLS blocking insert**:
   ```sql
   -- Check policies on user_profiles
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```

4. **Email service configured**:
   - Supabase → Authentication → Email Templates
   - Check SMTP settings

### Cannot Delete User

**Problem**: "Update or delete violates foreign key constraint"

**Cause**: User has related records in other tables

**Solutions**:

#### Option 1: Check Dependencies
```sql
-- Find what's blocking deletion
SELECT 
  tc.table_name,
  COUNT(*) as count
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('owner_id', 'user_id', 'cfi_id', 'pilot_id')
GROUP BY tc.table_name;

-- Check specific table
SELECT COUNT(*) FROM invoices WHERE owner_id = 'user-id';
```

#### Option 2: Reassign Ownership
```sql
-- Transfer all data to another user
UPDATE aircraft SET owner_id = 'new-owner-id' 
WHERE owner_id = 'old-owner-id';

UPDATE invoices SET owner_id = 'new-owner-id'
WHERE owner_id = 'old-owner-id';

-- Repeat for other tables...
```

#### Option 3: Soft Delete (Recommended)
```sql
-- Add deleted_at column
ALTER TABLE user_profiles 
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN deleted_by UUID REFERENCES user_profiles(id);

-- Update queries to filter deleted users
SELECT * FROM user_profiles WHERE deleted_at IS NULL;
```

---

## Authentication Issues

### User Can't Log In

**Problem**: Login fails with "Invalid credentials"

**Check**:

1. **Password correct** - Try password reset
2. **Email confirmed** - Check auth.users.email_confirmed_at
3. **Account active** - Not banned or deleted
4. **Auth configured** - Supabase settings correct

**Debug**:
```sql
-- Check user status
SELECT 
  id, 
  email, 
  email_confirmed_at,
  banned_until,
  deleted_at
FROM auth.users 
WHERE email = 'user@example.com';
```

### Session Expired

**Problem**: User logged out unexpectedly

**Causes**:
- Session timeout (default: 1 hour)
- Token refresh failed
- Supabase settings changed

**Solutions**:

```typescript
// Increase session timeout (in Supabase Dashboard)
// Authentication → Settings → JWT expiry: 3600 (1 hour)

// Handle token refresh in code
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    // Redirect to login
    window.location.href = '/login';
  }
});
```

### Cannot Access Admin Dashboard

**Problem**: "Insufficient permissions"

**Check User Role**:
```sql
-- Verify user has correct role
SELECT id, email, role FROM user_profiles 
WHERE email = 'your@email.com';
```

**Fix**:
```sql
-- Promote user to admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your@email.com';

-- Or use founder role for highest access
UPDATE user_profiles 
SET role = 'founder' 
WHERE email = 'your@email.com';
```

**Then**:
1. Log out completely
2. Clear browser cache
3. Log back in

### Google OAuth Not Working

**Problem**: Google sign-in fails

**Check**:

1. **Google OAuth configured in Supabase**:
   - Supabase → Authentication → Providers
   - Google enabled
   - Client ID and Secret set

2. **Authorized redirect URIs**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

3. **Environment variables**:
   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

---

## Deployment Issues

### Vercel Build Fails

**Problem**: Build fails in Vercel

**Common Causes**:

#### TypeScript Errors
- Fix locally: `npm run check`
- Vercel build logs show exact errors

#### Missing Environment Variables
- Vercel Dashboard → Settings → Environment Variables
- Add missing variables
- Redeploy

#### Build Timeout
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node",
      "config": { "maxLambdaSize": "50mb" }
    }
  ]
}
```

### Vercel Not Deploying

**Problem**: Git push doesn't trigger deployment

**Solutions**:

1. **Check Git Integration**:
   - Vercel Dashboard → Project Settings → Git
   - Verify repository connected

2. **Check GitHub Webhook**:
   - GitHub → Repo → Settings → Webhooks
   - Find Vercel webhook
   - Check recent deliveries

3. **Reconnect**:
   - Vercel → Settings → Git → Disconnect
   - Reconnect repository

4. **Manual Deploy**:
   ```bash
   # Use Vercel CLI
   vercel --prod
   ```

### Environment Variables Not Working in Production

**Problem**: App can't access env vars

**Cause**: Environment variables are embedded at build time

**Solution**:

1. Add/update variables in Vercel
2. **Redeploy** (not just rebuild)
   - Vercel Dashboard → Deployments
   - Latest deployment → ... → Redeploy

**Note**: Frontend variables need `VITE_` prefix:
```env
# ✅ Accessible in frontend
VITE_SUPABASE_URL=...

# ❌ Not accessible in frontend
SUPABASE_URL=...
```

### API Routes Return 404

**Problem**: `/api/*` endpoints not found

**Check**:

1. **Vercel config** (`vercel.json`):
   ```json
   {
     "functions": {
       "api/**/*.ts": {
         "maxDuration": 10
       }
     }
   }
   ```

2. **API files** in correct location:
   ```
   /api/
     └── index.ts  ✅
   /server/
     └── routes.ts  ❌ (wrong location for Vercel)
   ```

3. **Export format**:
   ```typescript
   // api/index.ts
   export default function handler(req, res) {
     // Handle request
   }
   ```

---

## Performance Issues

### Slow Page Load

**Problem**: Pages take long to load

**Check**:

1. **Network tab** in DevTools:
   - Find slow requests
   - Check sizes of resources
   - Look for failed requests

2. **Database queries**:
   ```sql
   -- Slow queries in Supabase
   -- Dashboard → Database → Logs → Query Performance
   ```

3. **Missing indexes**:
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_table_column ON table_name(column_name);
   ```

**Common Fixes**:

```typescript
// 1. Add query limits
const { data } = await supabase
  .from('table')
  .select('*')
  .limit(50);  // Don't fetch everything

// 2. Select only needed columns
const { data } = await supabase
  .from('aircraft')
  .select('id, tail_number, model')  // Not select('*')
  .eq('owner_id', userId);

// 3. Use pagination
const { data } = await supabase
  .from('invoices')
  .select('*')
  .range(0, 9)  // First 10 items
  .order('created_at', { ascending: false });
```

### High Memory Usage

**Problem**: Browser uses too much memory

**Causes**:
- Too many components rendering
- Memory leaks
- Large data sets

**Solutions**:

```typescript
// 1. Clean up useEffect
useEffect(() => {
  const subscription = supabase
    .channel('changes')
    .subscribe();
    
  // Cleanup!
  return () => {
    subscription.unsubscribe();
  };
}, []);

// 2. Memoize expensive computations
const expensiveValue = useMemo(() => {
  return calculateSomething(data);
}, [data]);

// 3. Virtualize long lists
import { useVirtualizer } from '@tanstack/react-virtual';
```

### Slow Database Queries

**Problem**: Queries take > 1 second

**Check Query Performance**:
```sql
EXPLAIN ANALYZE
SELECT * FROM your_table WHERE your_condition;
```

**Add Indexes**:
```sql
-- For WHERE clauses
CREATE INDEX idx_table_status ON table_name(status);

-- For JOIN columns
CREATE INDEX idx_table_fk ON table_name(foreign_key_id);

-- For ORDER BY
CREATE INDEX idx_table_created ON table_name(created_at DESC);

-- Composite indexes
CREATE INDEX idx_table_composite ON table_name(column1, column2);
```

---

## Getting Help

### Check Existing Documentation

1. [Getting Started](getting-started.md) - Setup guide
2. [Deployment Guide](deployment.md) - Deployment instructions
3. [Database Schema](../architecture/database-schema.md) - Schema reference
4. [Schema Reference](../architecture/schema-reference.md) - Detailed schema info

### Check Logs

**Browser Console**:
- F12 → Console tab
- Look for errors in red

**Vercel Logs**:
- Dashboard → Deployments → Click deployment → View Function Logs

**Supabase Logs**:
- Dashboard → Database → Logs
- Dashboard → Authentication → Logs

### Search Error Messages

Copy the error message and search:
1. GitHub Issues
2. Supabase Docs
3. Stack Overflow
4. Vercel Docs

### Create Detailed Bug Report

Include:
1. **What you were trying to do**
2. **What happened** (actual behavior)
3. **What you expected** (expected behavior)
4. **Error messages** (full text)
5. **Browser console logs**
6. **Steps to reproduce**

---

**Last Updated**: November 2025  
**Maintained By**: Development Team

