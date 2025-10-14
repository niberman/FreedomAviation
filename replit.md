# Freedom Aviation - Unified Web Application

## Overview
Freedom Aviation is a production-ready web application providing premium aircraft management and expert flight instruction for owner-pilots at Centennial Airport (KAPA). The platform unifies marketing pages with a secure owner dashboard. Its core purpose is to streamline aircraft management, flight instruction, and client interaction for an aviation business. The project aims to deliver a robust, scalable, and user-friendly solution with a premium aesthetic, targeting owner-pilots as its primary market.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates rather than large, infrequent ones. Please ask for my approval before making any major architectural changes or introducing new significant dependencies. I prefer detailed explanations of proposed changes and their impact. Do not make changes to the `attached_assets/` folder.

## System Architecture

### UI/UX Decisions
The application features an aviation-themed design with a deep blue palette (215 85% 25%) and monospace fonts for tail numbers. It employs a premium aesthetic with clean typography (Inter & JetBrains Mono), is responsive with a mobile-first approach, and includes full dark mode support based on system preferences. UI components like `StatusPill`, `Money`, and `CreditAmount` ensure consistent display of data.

### Technical Implementations
The frontend is built with React 18, TypeScript, and Vite, utilizing Wouter for routing, Tailwind CSS and shadcn/ui for styling, and TanStack Query for state management. Supabase provides authentication and database services (PostgreSQL). An Express.js backend can be integrated for custom API endpoints if needed. Type safety is maintained through auto-generated Supabase types and Zod validation for data hooks (`useAircraft`, `useServiceRequests`). Global error handling is managed via an `ErrorBoundary`.

### Feature Specifications
The application includes public marketing pages (`/`, `/login`) and protected dashboards for Owners (`/dashboard`, `/dashboard/more`), Admins (`/admin`), and CFIs (`/cfi`). Key features include:
- **Owner Dashboard**: Aircraft management, service requests, billing, and document management.
- **Admin Panel**: Kanban board and aircraft management.
- **CFI Panel**: Scheduling and student management.
- **Authentication**: Supabase Auth with global state management and protected routes.
- **Pricing System**: A comprehensive package pricing configurator that integrates hangar costs. This includes configurable service tiers, hangar partnership locations, global cost assumptions, aircraft-specific overrides, and a snapshot system for publishing pricing versions. An admin interface allows managing these configurations, and a public pricing page dynamically displays package options.

### System Design Choices
The project uses a component-based architecture for the frontend, organizing code into reusable UI components, feature modules, and pages. Utilities and infrastructure are separated into a `lib/` directory. Supabase Row Level Security (RLS) is extensively used to ensure data privacy and access control, with policies ensuring users only access their relevant data (owners their aircraft, CFIs their clients, admins full access). Environment variables are validated on startup to prevent silent failures. Auth state is managed globally and persists across sessions.

## Brand Transformation (October 2025)

### Overview
Transformed Freedom Aviation into a premium, Colorado-based brand with comprehensive SEO infrastructure and transparent pricing model.

### Brand & Copy
**Brand Manifest** (`client/src/brand/manifest.ts`):
- Centralized company information (phone, email, addresses)
- Partner facility details (Sky Harbour, Freedom Aviation Hangar)
- Tagline: "Colorado-Based. Front Range Focused."

**Homepage Hero** - Updated Copy:
- Primary: "Just fly. We do the rest."
- Subtext: Premium aircraft management, detailing, and pilot development for owner-operators across the Front Range
- CTAs: "See Plans & Start" (primary) → "/pricing", "Owner Portal" (secondary) → "/login"

### SEO Infrastructure

**Seo Component** (`client/src/components/Seo.tsx`):
- Dynamic meta tags (title, description, keywords)
- Open Graph and Twitter Card support
- JSON-LD structured data (LocalBusiness, Service schemas)
- Canonical URLs and geo-targeting
- Integrated with react-helmet-async

**Keywords System** (`client/src/seo/keywords.ts`):
- Services: aircraft management, detailing, flight instruction, etc.
- Modifiers: premium, Colorado, Front Range, transparent pricing
- Airports: KAPA, KBJC, KFTG, KDEN, KCOS, KBDU, KFNL, KGXY
- Partners: Sky Harbour, Freedom Aviation Hangar
- Location and airport-specific keyword helpers

**SEO Files**:
- `public/robots.txt` - Search engine directives, sitemap reference
- `public/sitemap.xml` - Complete site structure for crawlers

**Page SEO Implementation**:
- **Homepage** (`/`): LocalBusiness JSON-LD, comprehensive keywords, screen reader airport coverage
- **Pricing** (`/pricing`): Location-aware meta tags, dynamic descriptions based on selected hangar

### Pricing Enhancements
- Location toggle with hangar cost display
- SEO meta tags adapt to selected location
- Representative pricing disclaimer:
  > "Prices shown are representative class packages including selected hangar costs. Actual pricing may vary based on aircraft-specific requirements, travel costs, and facility availability. Hangar costs confirmed during onboarding. Facility availability subject to final confirmation."

### Technical Implementation
- HelmetProvider added to App.tsx for SEO support
- react-helmet-async for SSR compatibility
- Screen reader accessible keyword blocks on homepage
- Location-specific SEO keywords on pricing page

### Homepage Pricing Integration (October 2025)
**Service Packages Display** (`client/src/components/membership-tiers.tsx`):
- Fetches real pricing data from database using `useLatestSnapshot()` and `useLocations()` hooks
- Displays actual service class packages with base monthly pricing + hangar costs
- Shows "Most Popular" badge on middle tier
- Integrated hangar partner badges in same section
- Client-side navigation with Wouter (no page reloads)
- Memoized hangar lookups for optimal performance
- Comprehensive error handling with user-friendly messages
- Loading states with spinner
- "See Full Pricing" buttons navigate to /pricing page

**Implementation Details:**
- Removed standalone `PartnerBadges` component
- Combined service packages and hangar partners in single unified section
- Error states display helpful messages when data unavailable
- Falls back to "Pricing packages coming soon" if database empty

### Files Created/Modified
**New Files:**
- `client/src/brand/manifest.ts`
- `client/src/seo/keywords.ts`
- `client/src/components/Seo.tsx`
- `public/robots.txt`
- `public/sitemap.xml`

**Modified Files:**
- `client/src/components/hero-section.tsx` - Updated hero copy and CTAs
- `client/src/components/membership-tiers.tsx` - Integrated real pricing data and hangar partners
- `client/src/pages/home.tsx` - Added SEO, keyword blocks, removed PartnerBadges
- `client/src/pages/Pricing.tsx` - Added SEO and enhanced disclaimer
- `client/src/App.tsx` - Added HelmetProvider

## Development Tools

### Dev Toolbar (Development Mode Only)
A floating toolbar appears in the bottom-right corner during development to streamline navigation between pages and dashboards.

**Features:**
- **Quick Navigation**: Dropdown menus for Marketing Pages and Dashboards
- **Current Route Display**: Shows which page you're currently on
- **Minimizable**: Collapse to a single button when not needed
- **Auto-Hidden in Production**: Only appears when `import.meta.env.PROD === false`

**Usage:**
1. Look for the yellow "DEV MODE" toolbar in the bottom-right corner
2. Click "Marketing Pages" to navigate to Home, Pricing, Partner pages, or Login
3. Click "Dashboards" to switch between Owner, Admin, CFI, and Configurator views
4. Click minimize (down arrow) to collapse the toolbar

**Available Pages:**
- **Marketing**: Home, Pricing, Sky Harbour, FA Hangar, Login
- **Dashboards**: Owner Dashboard, Owner More, Admin, Pricing Configurator, Package Configurator, CFI

**Implementation:**
- Component: `client/src/components/dev-toolbar.tsx`
- Integrated in: `client/src/App.tsx`

## External Dependencies
- **Supabase**: Used for PostgreSQL database, authentication (`@supabase/supabase-js`), and Row Level Security (RLS).
- **React 18**: Frontend library.
- **TypeScript**: For type-safe development.
- **Vite**: Frontend build tool.
- **Wouter**: Client-side routing.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: UI component library built on Tailwind CSS.
- **TanStack Query (React Query)**: Data fetching and state management.
- **Zod**: Schema validation library.
- **Express.js**: (Optional) Backend framework for custom API endpoints.