# Freedom Aviation - Unified Web Application

## Project Overview

Freedom Aviation is a production-ready web application for premium aircraft management and expert flight instruction serving owner-pilots at Centennial Airport (KAPA). This unified platform combines marketing pages with an owner dashboard, using Supabase for authentication and database.

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: Wouter (React Router alternative)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Backend API**: Express.js (for any custom endpoints)

### Project Structure

```
/
├── client/src/                 # Frontend application
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui primitives + custom components
│   │   │   ├── status-pill.tsx      # Status badges with variants
│   │   │   ├── money.tsx            # Currency & credit formatting
│   │   │   └── ...                  # Other shadcn components
│   │   ├── owner/            # Owner-specific components
│   │   │   └── CreditsOverview.tsx
│   │   ├── error-boundary.tsx       # Global error boundary
│   │   ├── hero-section.tsx  # Marketing components
│   │   ├── features-grid.tsx
│   │   ├── membership-tiers.tsx
│   │   ├── testimonials.tsx
│   │   ├── footer.tsx
│   │   ├── your-aircraft-card.tsx  # Dashboard components
│   │   ├── kanban-board.tsx
│   │   ├── aircraft-table.tsx
│   │   └── protected-route.tsx     # Auth guard
│   ├── features/             # Feature modules
│   │   └── owner/
│   │       ├── components/   # Owner dashboard components
│   │       │   ├── QuickActions.tsx       # Service request forms
│   │       │   ├── ServiceTimeline.tsx    # Tasks & requests timeline
│   │       │   ├── BillingCard.tsx        # Invoice display
│   │       │   └── DocsCard.tsx           # Document management
│   │       └── types.ts      # TypeScript type definitions
│   ├── pages/                # Route pages
│   │   ├── home.tsx          # Marketing landing page (/)
│   │   ├── login.tsx         # Authentication (/login)
│   │   ├── owner-dashboard.tsx    # Owner portal (/dashboard)
│   │   ├── owner-more.tsx         # Owner settings
│   │   ├── admin-dashboard.tsx    # Admin panel (/admin)
│   │   └── cfi-dashboard.tsx      # CFI panel (/cfi)
│   ├── lib/                  # Shared utilities & infrastructure
│   │   ├── types/            # TypeScript type definitions
│   │   │   └── database.ts   # Generated Supabase types
│   │   ├── hooks/            # Typed, validated data hooks
│   │   │   ├── useAircraft.ts       # Aircraft CRUD with Zod validation
│   │   │   └── useServiceRequests.ts # Service requests with validation
│   │   ├── supabase.ts       # Supabase client
│   │   ├── auth-context.tsx  # Auth provider & hooks
│   │   ├── queryClient.ts    # React Query setup
│   │   ├── creditCalculator.ts    # Credit tier utilities
│   │   └── utils.ts          # Helper functions
│   ├── hooks/                # Custom React hooks
│   ├── App.tsx               # Root component with routing & error boundary
│   └── index.css             # Global styles & design tokens
├── server/                    # Express backend (if needed)
├── shared/                    # Shared types & schemas
├── attached_assets/          # Images & media
│   ├── freedom-aviation-logo.png   # Company logo
│   └── stock_images/         # Hero images
└── design_guidelines.md      # Design system documentation
```

## Routes

### Marketing (Public)
- `/` - Home page with hero, features, tiers, testimonials

### Authentication
- `/login` - Sign in page (Supabase Auth)

### Dashboard (Protected)
- `/dashboard` - Owner aircraft management portal
- `/dashboard/more` - Owner settings and preferences
- `/admin` - Admin kanban & aircraft management
- `/cfi` - CFI scheduling and student management

## Authentication Flow

1. **Supabase Integration**: Uses `@supabase/supabase-js` for auth
2. **Auth Context**: Global auth state via `AuthProvider` in `lib/auth-context.tsx`
3. **Protected Routes**: `ProtectedRoute` component guards dashboard pages
4. **Session Management**: Automatic session refresh via Supabase SDK

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DATABASE_URL` - Supabase database connection string

## Design System

See `design_guidelines.md` for complete design specifications.

### Key Design Principles
- **Aviation-themed**: Deep blue palette (215 85% 25%), monospace tail numbers
- **Premium aesthetic**: Clean typography with Inter & JetBrains Mono
- **Responsive**: Mobile-first approach with PWA readiness
- **Dark mode**: Full dark mode support with automatic system preference

### Color Tokens
- Primary: Deep Aviation Blue (#0A2540)
- Secondary: Slate Gray
- Accent: Sky Blue (used sparingly)
- Status colors: Green (ready), Amber (due soon), Red (overdue)

## Database Schema (Supabase)

### Planned Tables
- `users` - User profiles (linked to Supabase Auth)
- `aircraft` - Aircraft registry with tail numbers, models, class
- `memberships` - Owner membership tiers (I, II, III)
- `maintenance` - Maintenance tracking and due dates
- `service_requests` - Owner service request queue
- `instructors` - CFI profiles and availability
- `pricing_packages` - Configurable service packages

## Type Safety & Data Layer

### Generated TypeScript Types
- **Database Types**: Auto-generated from Supabase schema in `lib/types/database.ts`
- **Type Exports**: Helper types for common entities (Aircraft, ServiceRequest, Membership, etc.)
- **Full Type Safety**: Row, Insert, and Update types for all tables

### Validated Data Hooks
- **useAircraft**: Type-safe aircraft CRUD with Zod validation
  - Validates tail number format (N12345A pattern)
  - Automatic owner_id assignment
  - Optimistic updates with React Query
  
- **useServiceRequests**: Service request management with validation
  - Fuel grade enums (100LL, Jet-A, MoGas)
  - Priority levels (low, medium, high)
  - Status tracking (pending, in_progress, completed, cancelled)

### UI Components
- **StatusPill**: Consistent status badges with predefined variants
- **Money**: Currency formatting with negative/positive indicators
- **CreditAmount**: Credit display with proper pluralization
- **ErrorBoundary**: Global error handling with graceful fallbacks

## Development

### Running Locally
```bash
npm run dev  # Starts Vite dev server on port 5000
```

### Building for Production
```bash
npm run build  # Builds optimized production bundle
npm start      # Runs production server
```

## Future Enhancements

1. **Stripe Integration** - Billing and subscription management
2. **Pricing Configurator** - Dynamic package builder with pricing calculator
3. **PWA Support** - Install dashboard as mobile app
4. **Custom Domain** - Deploy to freedomaviationco.com with optional dashboard subdomain
5. **Real-time Updates** - Supabase Realtime for live maintenance status
6. **File Uploads** - Aircraft document management
7. **Calendar Integration** - CFI scheduling system

## Migration Status

- ✅ Supabase client configured with environment validation
- ✅ Authentication flow implemented with proper loading states
- ✅ Protected routes with auth guards
- ✅ Marketing components migrated
- ✅ Dashboard components integrated
- ✅ Design system unified
- ✅ Database schema with complete RLS policies
- ✅ Auto-create user profiles on signup (via trigger)
- ✅ Comprehensive setup documentation
- ⏳ Connect dashboard components to real data
- ⏳ Stripe payment integration
- ⏳ PWA configuration

## Critical Security Features

### Environment Validation
- Supabase client throws clear error if env vars missing
- Prevents silent failures with empty credentials

### Auth State Management
- Loading state properly cleared on all auth transitions
- No infinite spinners on sign-in/sign-out

### Row Level Security (RLS)
- All tables have proper RLS policies with WITH CHECK clauses
- Owners see only their own data
- CFIs can view/update client data
- Admins have full CRUD access
- User profiles auto-created via database trigger

## Notes

- Original dashboard was on Neon DB - now migrated to Supabase
- ZIP file contained business documents, not code (contracts, proposals, insurance)
- All components use shared design tokens from `index.css`
- Auth state persists across page refreshes via Supabase session management
