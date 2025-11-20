# Database Connection Guide
**Date**: November 20, 2025  
**Purpose**: How to connect to Supabase PostgreSQL from your local machine

---

## 🔌 Your Connection Details

**Project**: Freedom Aviation  
**Project Ref**: `wsepwuxkwjnsgmkddkjw`  
**Supabase URL**: `https://wsepwuxkwjnsgmkddkjw.supabase.co`  
**Database**: `postgres`  
**Port**: `5432`

---

## 🚀 Quick Start - 3 Easy Methods

### Method 1: Use Our Helper Scripts (Easiest!)

We've created helper scripts for you:

#### A. Run a migration file
```bash
./scripts/run-sql-file.sh migrations/create_membership_quotes_table.sql
```

#### B. Open interactive SQL console
```bash
./scripts/connect-to-supabase.sh
```

**Note**: You'll be prompted for your Supabase database password. Get it from:
```
Supabase Dashboard → Settings → Database → Connection string
```

---

### Method 2: Direct psql Connection

If you have `psql` installed:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@wsepwuxkwjnsgmkddkjw.supabase.co:5432/postgres?sslmode=require"
```

Replace `[YOUR-PASSWORD]` with your Supabase database password.

---

### Method 3: Supabase Dashboard SQL Editor (No Setup Required!)

The easiest way if you don't have psql:

1. Go to: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/sql
2. Paste your SQL
3. Click "Run"

This is the recommended way to run migrations!

---

## 📋 Common Tasks

### Run the Membership Quotes Migration

**Using Dashboard** (Recommended):
1. Open: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/sql/new
2. Copy contents of: `migrations/create_membership_quotes_table.sql`
3. Paste and click "Run"

**Using Script**:
```bash
./scripts/run-sql-file.sh migrations/create_membership_quotes_table.sql
```

---

### List All Tables

```bash
# Using psql
psql "postgresql://postgres:[PASSWORD]@wsepwuxkwjnsgmkddkjw.supabase.co:5432/postgres?sslmode=require" \
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

# Or use our script
./scripts/connect-to-supabase.sh
# Then in psql:
\dt
```

---

### Check if a Table Exists

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'membership_quotes'
);
```

---

### View Table Structure

```sql
-- In psql console:
\d membership_quotes

-- Or using SQL:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'membership_quotes'
ORDER BY ordinal_position;
```

---

## 🔐 Getting Your Database Password

Your database password is **NOT** the same as your Supabase project API keys!

**To find it**:
1. Go to: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/settings/database
2. Scroll to "Connection string"
3. Click "Show" next to the password
4. Copy it for use in commands

**Optionally, add to env.local**:
```bash
SUPABASE_DB_PASSWORD=your-database-password-here
```

Then our scripts will use it automatically!

---

## 🛠️ Installing PostgreSQL Client (if needed)

### On macOS:
```bash
brew install postgresql
```

### On Linux:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# Fedora/RHEL
sudo dnf install postgresql
```

### On Windows:
Download from: https://www.postgresql.org/download/windows/

---

## 📊 Useful Queries

### See All Tables
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Count Rows in Tables
```sql
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### Check RLS Status
```sql
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### List All Policies
```sql
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🎯 Recommended Workflow

For running migrations and queries from Cursor:

1. **For one-off queries**: Use Supabase Dashboard SQL Editor (no setup)
2. **For migrations**: Use `./scripts/run-sql-file.sh` (after setting password)
3. **For exploration**: Use `./scripts/connect-to-supabase.sh` (interactive)

---

## ⚡ Quick Commands

```bash
# Add password to environment (one-time setup)
echo "SUPABASE_DB_PASSWORD=your-password-here" >> env.local

# Run any migration
./scripts/run-sql-file.sh migrations/create_membership_quotes_table.sql

# Open SQL console
./scripts/connect-to-supabase.sh

# Run inline query
SUPABASE_DB_PASSWORD=your-password psql \
  "postgresql://postgres@wsepwuxkwjnsgmkddkjw.supabase.co:5432/postgres?sslmode=require" \
  -c "SELECT COUNT(*) FROM user_profiles;"
```

---

## 🔗 External Tools (Optional)

If you prefer a GUI, you can use:

1. **Supabase Dashboard** (built-in, easiest)
   - https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/editor

2. **TablePlus** (macOS app)
   - Connection type: PostgreSQL
   - Host: `wsepwuxkwjnsgmkddkjw.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: [from dashboard]
   - SSL: Required

3. **pgAdmin** (cross-platform)
   - Similar connection details as above

4. **DBeaver** (cross-platform, free)
   - Similar connection details as above

---

## ✅ Next Steps

1. **Get your database password** from Supabase dashboard
2. **Add it to env.local**: `SUPABASE_DB_PASSWORD=...`
3. **Run our new migration**:
   ```bash
   ./scripts/run-sql-file.sh migrations/create_membership_quotes_table.sql
   ```

Or just use the Supabase Dashboard SQL Editor (easiest, no setup)!

---

**END OF GUIDE**  
**Generated**: November 20, 2025

