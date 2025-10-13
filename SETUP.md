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

Already configured in Replit Secrets:
- ✅ `VITE_SUPABASE_URL` - Frontend access to Supabase
- ✅ `VITE_SUPABASE_ANON_KEY` - Frontend auth key
- ✅ `DATABASE_URL` - Direct database connection (if needed)

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

### 4. Sample Data (Optional)

To add sample aircraft and memberships, run this in Supabase SQL Editor:

\`\`\`sql
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
\`\`\`

## Application Routes

### Marketing (Public)
- `/` - Landing page with hero, features, tiers, testimonials

### Authentication
- `/login` - Sign in page

### Dashboard (Protected - Requires Auth)
- `/dashboard` - Owner aircraft portal
- `/dashboard/more` - Settings and preferences
- `/admin` - Admin kanban and management
- `/cfi` - CFI panel

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
\`\`\`bash
npm run dev  # Starts on port 5000
\`\`\`

### Type Checking
\`\`\`bash
npm run check  # TypeScript type check
\`\`\`

### Building for Production
\`\`\`bash
npm run build  # Creates optimized build
npm start      # Runs production server
\`\`\`

## Next Steps

### Immediate
1. ✅ Run `supabase-schema.sql` in Supabase
2. ✅ Create first user account
3. ✅ Add sample aircraft data
4. ✅ Test authentication flow

### Phase 2 - Data Integration
1. Update `YourAircraftCard` to fetch real aircraft data
2. Connect `KanbanBoard` to service_requests table
3. Wire up `MaintenanceList` to maintenance table
4. Implement real-time updates with Supabase Realtime

### Phase 3 - Advanced Features
1. Add sign-up page
2. Implement password reset flow
3. Add user profile editing
4. Create admin user management
5. Build service request form

### Phase 4 - Stripe Integration
1. Install Stripe SDK
2. Create pricing configurator
3. Implement subscription management
4. Add payment history

### Phase 5 - PWA & Mobile
1. Add PWA manifest
2. Configure service worker
3. Enable offline support
4. Test mobile app installation

## Troubleshooting

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

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Review browser console for errors
3. Verify database schema is fully created
4. Check that all environment variables are set
