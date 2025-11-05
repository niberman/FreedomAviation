# Freedom Aviation - Setup Guide

## Quick Start

### 1. Supabase Database Setup

**IMPORTANT**: Run the schema script to set up all tables, Row Level Security policies, and triggers.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project: `wsepwuxkwjnsgmkddkjw`
3. Navigate to **SQL Editor**
4. Copy the **entire contents** of `supabase-schema.sql`
5. Paste into SQL Editor and click **Run**
6. Verify success - you should see tables created with proper RLS policies

**What this creates:**
- All database tables (user_profiles, aircraft, memberships, maintenance, service_requests, etc.)
- Row Level Security (RLS) policies for data access control
- Trigger to auto-create user_profiles when users sign up
- Sample pricing packages (Class I, II, III)
- Indexes for performance

**Critical Features:**
- ✅ User profiles auto-created on signup via database trigger
- ✅ Proper RLS policies with WITH CHECK clauses for inserts/updates
- ✅ Admin/CFI roles can manage all data
- ✅ Owners see only their own aircraft and requests

### 2. Environment Variables

Configure these in your deployment platform (Vercel, Replit, etc.):
- `VITE_SUPABASE_URL` - Frontend access to Supabase
- `VITE_SUPABASE_ANON_KEY` - Frontend auth key
- `DATABASE_URL` - Direct database connection (optional)

### 3. First User Setup

#### Option A: Sign Up via UI
1. Run the app: `npm run dev`
2. Navigate to `/login`
3. Click "Sign Up" (you'll need to add this button)
4. Enter email and password
5. Check email for confirmation link

#### Option B: Create User in Supabase
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Enter email and password
4. User will automatically get a profile in `user_profiles` table

### 4. Create Admin Account

**CRITICAL**: To access the admin dashboard at `/admin`, you need to promote a user to admin role.

1. First, create a user account (via UI or Supabase Dashboard)
2. Go to Supabase Dashboard → SQL Editor
3. Copy the contents of `scripts/setup-admin.sql`
4. Replace `YOUR_EMAIL@example.com` with your actual email
5. Run the script to promote your user to admin role

**Quick Admin Setup:**
```sql
-- Replace with your actual email address
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, full_name, role 
FROM public.user_profiles 
WHERE email = 'your-email@example.com';
```

Now you can:
- Access `/admin` dashboard (requires admin or CFI role)
- Manage all aircraft, maintenance, and service requests
- Configure pricing and view all client data

### 5. Sample Data (Optional)

To add sample aircraft and memberships, run this in Supabase SQL Editor:

```sql
-- Insert a sample aircraft (replace USER_ID with actual user UUID)
INSERT INTO public.aircraft (tail_number, make, model, year, class, hobbs_hours, tach_hours, owner_id, image_url)
VALUES (
  'N353DW',
  'Cirrus',
  'SR22T',
  2018,
  'High Performance',
  523.5,
  498.2,
  'YOUR_USER_ID_HERE',
  'https://wsepwuxkwjnsgmkddkjw.supabase.co/storage/v1/object/public/aircraft/sr22t.jpg'
);

-- Insert a membership for the user
INSERT INTO public.memberships (user_id, aircraft_id, class, monthly_rate, active)
SELECT 
  'YOUR_USER_ID_HERE',
  id,
  'II',
  599.00,
  true
FROM public.aircraft WHERE tail_number = 'N353DW';

-- Insert sample maintenance items
INSERT INTO public.maintenance (aircraft_id, item_name, due_date, due_hobbs, status)
SELECT 
  id,
  'Annual Inspection',
  CURRENT_DATE + INTERVAL '45 days',
  600.0,
  'current'
FROM public.aircraft WHERE tail_number = 'N353DW';

INSERT INTO public.maintenance (aircraft_id, item_name, due_hobbs, status)
SELECT 
  id,
  'Oil Change',
  550.0,
  'due_soon'
FROM public.aircraft WHERE tail_number = 'N353DW';
```

## Application Routes

### Marketing (Public)
- `/` - Landing page with hero, features, tiers, testimonials

### Authentication
- `/login` - Sign in page

### Dashboard (Protected - Requires Auth)
- `/dashboard` - Owner aircraft portal (any authenticated user)
- `/dashboard/more` - Settings and preferences (any authenticated user)
- `/admin` - Admin kanban and management (requires admin or CFI role)
- `/admin/pricing` - Pricing configurator (requires auth)
- `/staff` - Alternative staff dashboard (requires admin or CFI role)

## Architecture Overview

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Tailwind CSS** + shadcn/ui for styling
- **Supabase** for auth and database

### Key Files
- `client/src/lib/supabase.ts` - Supabase client
- `client/src/lib/auth-context.tsx` - Auth provider and hooks
- `client/src/components/protected-route.tsx` - Route guard
- `shared/supabase-types.ts` - TypeScript types for database

### Authentication Flow
1. User signs in via `/login` page
2. Supabase Auth creates session
3. `AuthProvider` manages global auth state
4. `ProtectedRoute` guards dashboard pages
5. RLS policies enforce data access control

## Database Schema

### Core Tables
- `user_profiles` - User information (extends Supabase Auth)
- `aircraft` - Aircraft registry with tail numbers
- `memberships` - Owner membership tiers (I, II, III)
- `maintenance` - Maintenance tracking
- `service_requests` - Service request queue
- `instructors` - CFI profiles
- `pricing_packages` - Service package pricing

### Row Level Security (RLS)
All tables have RLS enabled. Policies ensure:
- Owners see only their own aircraft and data
- CFIs can view client aircraft and requests
- Admins have full access
- Public can view pricing packages and instructor bios

## Development

### Running Locally
```bash
npm run dev  # Starts on port 5000
```

### Type Checking
```bash
npm run check  # TypeScript type check
```

### Building for Production
```bash
npm run build  # Creates optimized build
npm start      # Runs production server
```

## Additional Setup

For payment processing and email functionality, see:
- [STRIPE_SETUP.md](STRIPE_SETUP.md) - Stripe payment integration
- [EMAIL_SETUP.md](EMAIL_SETUP.md) - Email service configuration

## Troubleshooting

### Can't Access Admin Dashboard

If you're being redirected when trying to access `/admin`:

1. **Run the diagnostic script**: Execute `scripts/check-setup.sql` in Supabase SQL Editor to identify issues
2. **Verify user profile exists**: Make sure your user has a profile in `user_profiles` table
3. **Check your role**: Confirm your user has `role = 'admin'` in `user_profiles`
4. **Verify trigger exists**: The `on_auth_user_created` trigger should auto-create profiles

**Quick Fix:**
```sql
-- Check your current role
SELECT email, role FROM public.user_profiles WHERE email = 'your-email@example.com';

-- If role is not admin, promote yourself
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### "Invalid login credentials"
- Verify user exists in Supabase Auth
- Check email is confirmed
- Ensure RLS policies are created

### "Failed to fetch"
- Check environment variables are set
- Verify Supabase project URL is correct
- Ensure anon key has proper permissions

### Data not showing
- Verify RLS policies allow access
- Check user role in user_profiles table
- Ensure sample data is inserted correctly

### Profile Missing After Signup

If you sign up but don't have a `user_profiles` entry:

1. Check if the trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. If trigger is missing, recreate it by running the trigger section from `supabase-schema.sql`

3. Manually create the profile:
```sql
-- Replace with your actual user UUID from auth.users
INSERT INTO public.user_profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE email = 'your-email@example.com';
```

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Review browser console for errors
3. Verify database schema is fully created
4. Check that all environment variables are set
