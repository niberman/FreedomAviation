# Schema Sync Summary

## What Was Done

I've created a comprehensive set of tools to help you pull the current schema from your Supabase database and update the `supabase-schema.sql` file.

### Files Created

1. **`SCHEMA_PULL_INSTRUCTIONS.md`** - Complete guide with 4 different methods to export your schema
2. **`scripts/export-complete-schema.sql`** - SQL script to run in Supabase SQL Editor (RECOMMENDED)
3. **`scripts/dump-schema.js`** - Node.js script to check database status
4. **`scripts/pull-schema.sh`** - Shell script with export instructions
5. **`scripts/pull-schema.mjs`** - Advanced export script (requires special setup)

### Files Updated

1. **`scripts/README.md`** - Added documentation for all schema export tools

## Database Status Check

I ran a check on your Supabase database and found:

### ✅ Tables That Exist:
- `user_profiles`
- `aircraft`
- `memberships`
- `maintenance`
- `consumable_events`
- `service_requests`
- `service_tasks`
- `invoices`
- `invoice_lines`

### ⚠️ Tables in Schema File But NOT in Database:
- `instructors`
- `pricing_packages`

**This means:** Your schema file has definitions for tables that don't actually exist in your database yet. You may want to create these tables, or remove them from the schema file if they're not needed.

## What You Need to Do Next

### Option A: Use Supabase SQL Editor (Easiest - 5 minutes)

This is the recommended method:

1. **Open Supabase SQL Editor**
   - Go to: https://app.supabase.com/project/wsepwuxkwjnsgmkddkjw/sql/new

2. **Run the Export Script**
   - Open file: `scripts/export-complete-schema.sql`
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Copy the Results**
   - Look in the "Messages" tab (not Results tab)
   - You'll see a complete schema output with:
     - All enum types
     - All table definitions
     - All indexes
     - All RLS policies
     - All functions and triggers

4. **Update supabase-schema.sql**
   - Compare the output with your current `supabase-schema.sql`
   - Update the file to match your actual database
   - Save the changes

### Option B: Use pg_dump (Most Complete - 10 minutes)

If you have PostgreSQL installed and your database password:

1. **Get your database password**
   - Go to: https://app.supabase.com/project/wsepwuxkwjnsgmkddkjw/settings/database
   - Copy or reset your database password

2. **Run pg_dump**
   ```bash
   pg_dump "postgresql://postgres:YOUR_PASSWORD@db.wsepwuxkwjnsgmkddkjw.supabase.co:5432/postgres" \
     --schema=public --schema-only --no-owner --no-acl \
     > supabase-schema-current.sql
   ```

3. **Review and merge**
   - Review the generated `supabase-schema-current.sql`
   - Merge relevant changes into `supabase-schema.sql`

### Option C: Use Supabase CLI (If you prefer CLI)

1. **Install CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login and link**
   ```bash
   supabase login
   supabase link --project-ref wsepwuxkwjnsgmkddkjw
   ```

3. **Pull schema**
   ```bash
   supabase db pull
   ```

## Important Decisions to Make

### 1. Missing Tables

You need to decide what to do about the missing `instructors` and `pricing_packages` tables:

**Option A: Create them in database**
- Run the relevant sections from `supabase-schema.sql` in Supabase SQL Editor
- This will create the tables in your database

**Option B: Remove from schema file**
- If you're not using these features, remove them from `supabase-schema.sql`
- This will make your schema file match reality

### 2. Schema as Source of Truth

Decide which is the "source of truth":
- **Database is truth**: Update `supabase-schema.sql` to match what's in the database
- **Schema file is truth**: Update database to match what's in `supabase-schema.sql`

## Quick Check

To quickly verify your database status, run:

```bash
node scripts/dump-schema.js
```

This will:
- Confirm connection to Supabase
- List all accessible tables
- Show your project ID
- Provide export instructions

## Need Help?

All instructions are also available in:
- `SCHEMA_PULL_INSTRUCTIONS.md` - Detailed step-by-step guide
- `scripts/README.md` - Documentation of all scripts

## Next Steps After Syncing

Once you've synced the schema:

1. **Test the application** - Make sure everything still works
2. **Commit changes** - Save the updated schema file to git
3. **Document any changes** - Note what was different
4. **Create missing tables** - If you decide to add `instructors` and `pricing_packages`

---

**TL;DR**: Run `scripts/export-complete-schema.sql` in Supabase SQL Editor, copy the output from the Messages tab, and use it to update `supabase-schema.sql`. The easiest method takes about 5 minutes.


