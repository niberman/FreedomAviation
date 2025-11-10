# Setup Instructions - Database & Quote-Based Onboarding

## Problems Fixed
Your application was showing these errors:
- ❌ `api/service-requests` returning 503 (Service Unavailable)
- ❌ `onboarding_data` table not found (404 errors)

## Solutions Implemented

### 1. Database Tables Created
The following tables were missing from your Supabase database:
- `service_requests` - For managing service requests from owners
- `onboarding_data` - For tracking user onboarding progress
- `membership_quotes` - **NEW** For storing membership quotes (replaces direct payment)

### 2. Quote-Based Onboarding Flow
The onboarding flow has been updated to generate quotes instead of processing payments:
- ✅ Users select their membership tier
- ✅ System generates a detailed quote
- ✅ Quote is saved to the database
- ✅ Users get access to their owner dashboard
- ✅ No Stripe payment required during onboarding
- ✅ Staff can view and follow up on quotes

## Steps to Fix

### 1. Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### 2. Run the SQL Script
1. Open the file: `scripts/fix-missing-tables-complete.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** button (or press Cmd/Ctrl + Enter)

### 3. Verify Success
You should see output like:
```
✓ service_requests table exists
✓ membership_quotes table exists
✓ onboarding_data table exists
```

### 4. Refresh Your Application
- Reload your browser
- The 503 errors should be gone
- Staff dashboard should now load service requests
- Pricing page should now lead to quote generation (not payment)

## What This Script Does

### ✅ Creates `service_requests` table
  - Basic fields (id, user_id, aircraft_id, service_type, etc.)
  - Request details (airport, departure time, fuel info, etc.)
  - Status tracking (status, assigned_to, notes)
  - Timestamps (created_at, updated_at)

### ✅ Creates `membership_quotes` table (NEW)
  - Stores membership quote information
  - Tracks: package_id, tier_name, base_monthly, hangar_cost, total_monthly
  - Aircraft details: tail_number, make, model
  - Status tracking (pending, approved, rejected)
  - Allows staff to view all quotes

### ✅ Creates `onboarding_data` table
  - Tracks onboarding progress through steps
  - Stores personal info, aircraft info, membership selection
  - Tracks quote generation status
  - Optional Stripe fields (for future use)

### ✅ Sets up Row Level Security (RLS) policies
  - Users can view/create their own service requests & quotes
  - Staff/CFI/Admin can view all service requests & quotes
  - Staff/Admin can update/delete service requests
  - Users can manage their own onboarding data

### ✅ Performance & Maintenance
  - Creates indexes for faster queries
  - Adds automatic timestamp updates
  - Grants proper permissions to authenticated users

## Troubleshooting

If you still see errors after running the script:

1. **Check for other missing tables**: Run this query to see all your tables:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. **Verify RLS is enabled**: Run this query:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('service_requests', 'onboarding_data');
   ```

3. **Check your Supabase connection**: Make sure your environment variables are set correctly:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Need to Run Full Schema?

If you need to set up the entire database from scratch, use:
```bash
# Run the complete schema
supabase-schema.sql
```

This includes all tables: user_profiles, aircraft, memberships, maintenance, service_tasks, instructors, invoices, etc.

## New Onboarding Flow

### How It Works Now

1. **Pricing Page** → User selects:
   - Hangar location (optional)
   - Service tier (Class I, II, III, or Turbo Founders)
   
2. **Onboarding Steps**:
   - **Welcome** - Introduction
   - **Personal Info** - Name, phone, contact details
   - **Aircraft Info** - Tail number, make, model, location
   - **Membership** - Confirm tier and pricing
   - **Quote Generation** - Creates detailed quote (NO PAYMENT)
   - **Complete** - Access to owner dashboard

3. **After Onboarding**:
   - User gets full access to their owner dashboard
   - Can view their aircraft
   - Can submit service requests
   - Quote is saved in database with status "pending"
   - Staff can view quotes and follow up

### Staff Quote Management

Staff can view all membership quotes:
```sql
SELECT * FROM membership_quotes 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

Update quote status after contact:
```sql
UPDATE membership_quotes 
SET status = 'approved', notes = 'Membership activated' 
WHERE id = '<quote_id>';
```

## Benefits of Quote-Based Approach

- ✅ **No payment friction** - Users can explore without credit card
- ✅ **Personal touch** - Staff can discuss details before committing
- ✅ **Flexibility** - Pricing can be customized per customer
- ✅ **Better conversion** - Lower barrier to entry
- ✅ **Data collection** - Capture aircraft & owner info early
- ✅ **Simpler setup** - No Stripe configuration required initially

