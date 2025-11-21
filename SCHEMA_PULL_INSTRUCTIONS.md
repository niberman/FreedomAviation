# How to Pull Schema from Supabase

This guide explains how to extract the current database schema from your Supabase instance and update the `supabase-schema.sql` file.

## Current Status

✅ **Confirmed Tables in Your Database:**
- `user_profiles`
- `aircraft`
- `memberships`
- `maintenance`
- `consumable_events`
- `service_requests`
- `service_tasks`
- `invoices`
- `invoice_lines`

❌ **Tables NOT found** (may need to be created):
- `instructors`
- `pricing_packages`

## Method 1: Supabase SQL Editor (Recommended - Easiest)

### Step 1: Open SQL Editor

Go to your Supabase SQL Editor:
https://app.supabase.com/project/wsepwuxkwjnsgmkddkjw/sql/new

### Step 2: Run the Export Script

1. Open the file: `scripts/export-complete-schema.sql`
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor
4. Click "Run"

### Step 3: Copy the Results

The query will output the complete schema in the "Messages" tab (not the Results tab). Look for:
- Enum types
- Table definitions
- Indexes
- RLS policies
- Functions
- Triggers

### Step 4: Update supabase-schema.sql

Copy all the output from the Messages tab and use it to update your `supabase-schema.sql` file.

---

## Method 2: Using pg_dump (Most Complete)

This method requires your database password.

### Step 1: Get Database Password

1. Go to: https://app.supabase.com/project/wsepwuxkwjnsgmkddkjw/settings/database
2. Find your database password (or reset it if you don't have it)

### Step 2: Run pg_dump

```bash
pg_dump "postgresql://postgres:YOUR_PASSWORD@db.wsepwuxkwjnsgmkddkjw.supabase.co:5432/postgres" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-acl \
  > supabase-schema-current.sql
```

Replace `YOUR_PASSWORD` with your actual database password.

### Step 3: Review and Update

Review the generated `supabase-schema-current.sql` file and update your main `supabase-schema.sql` with any changes.

---

## Method 3: Using Supabase CLI

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login and Link

```bash
supabase login
supabase link --project-ref wsepwuxkwjnsgmkddkjw
```

### Step 3: Pull Schema

```bash
supabase db pull
```

This will create migration files with your current schema.

---

## Method 4: Quick Table Check (Already Done)

You can run the check script to see which tables exist:

```bash
node scripts/dump-schema.js
```

This confirms which tables are currently in your database.

---

## Important Notes

1. **Missing Tables**: The following tables appear in `supabase-schema.sql` but were NOT found in your database:
   - `instructors`
   - `pricing_packages`

   You may need to create these tables by running the relevant parts of `supabase-schema.sql` in your Supabase SQL Editor.

2. **RLS Policies**: Make sure to capture all Row Level Security policies as they are critical for data access control.

3. **Functions and Triggers**: Don't forget to include custom functions and triggers in your schema file.

4. **Enum Types**: Enum types must be created before the tables that use them.

## After Pulling the Schema

Once you've pulled the current schema, compare it with your existing `supabase-schema.sql` file to:

1. Identify any missing tables (like `instructors` and `pricing_packages`)
2. Check for schema drift (differences between documented and actual schema)
3. Update documentation to match reality
4. Decide whether to update the database or the schema file as the source of truth

## Need Help?

If you encounter any issues:
1. Check that your service role key is correct in `env.local`
2. Verify you have permission to access the schema information
3. Ensure your Supabase project is active and accessible


