# Freedom Aviation

> Premium aircraft management platform for owners, flight instructors, and administrators at Centennial Airport (KAPA), Colorado.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com)

## Overview

Freedom Aviation is a full-stack web and mobile application for comprehensive aircraft management, maintenance coordination, flight instruction scheduling, and service operations. Built with modern technologies and designed for aircraft owners, CFIs (Certified Flight Instructors), operations staff, and administrators.

**Location**: 7565 S Peoria St, Englewood, CO 80112 (Centennial Airport - KAPA)  
**Website**: [freedomaviationco.com](https://freedomaviationco.com)  
**Phone**: (970) 618-2094

## Key Features at a Glance

| Category | Features |
|----------|----------|
| **Authentication** | Email/password, Google OAuth, JWT sessions, password reset, 6-tier RBAC |
| **Aircraft Management** | Multi-aircraft tracking, Hobbs/Tach monitoring, maintenance alerts, service history |
| **Maintenance** | Calendar/hobbs/tach-based tracking, status alerts, automated scheduling |
| **Service Requests** | Priority levels, Kanban workflow, drag-and-drop, email notifications |
| **Billing & Payments** | Stripe integration, invoice management, 3-tier pricing, transparent calculator |
| **CFI Scheduling** | Google Calendar sync, availability management, student tracking |
| **Email Notifications** | Resend service, role-based delivery, HTML templates, queue system |
| **Mobile** | PWA installable, iOS app (Capacitor), offline support, responsive design |
| **Database** | PostgreSQL 16, 45+ tables, RLS on all tables, comprehensive relationships |
| **SEO** | Local SEO optimized, structured data, sitemap, 95+ Lighthouse score |
| **Security** | Row-level security, encrypted tokens, HTTPS, API protection, PCI compliance |
| **Tech Stack** | React 18, TypeScript 5.6, Vite 5.4, Tailwind 3.4, Express 4.21 |
| **Deployment** | Vercel hosting, branch previews, automatic deployments, serverless functions |
| **Documentation** | 25+ docs, architecture guides, API reference, troubleshooting |

## Features

### ✈️ For Aircraft Owners

**Dashboard & Management**
- 📊 Real-time aircraft status and metrics dashboard
- 🛩️ Multi-aircraft tracking with detailed profiles
- 📸 Aircraft images and comprehensive documentation
- ⏱️ Hobbs and Tach hour tracking with automatic sync
- ⛽ Fuel capacity monitoring (usable and tabs)
- 🎯 Personalized onboarding flow for new members
- 📱 Fully responsive mobile interface with PWA support
- 🍎 Native iOS app (Capacitor-powered)

**Maintenance & Service**
- 🔧 Automated maintenance tracking (calendar, hobbs, and tach-based)
- 🚨 Maintenance status alerts (current, due soon, overdue)
- 📝 Service request submission with priority levels (low, medium, high, urgent)
- ✈️ Pre-flight concierge scheduling and coordination
- 🔔 Real-time email notifications via Resend
- 📋 Complete service history with detailed records
- 🛠️ Professional maintenance coordination

**Fluid & Systems Management**
- 💧 Automatic fluid top-offs (Oil, O₂, TKS)
- 📊 Database updates (avionics navigation)
- ✅ Pre/post-flight checks and staging
- 🧼 Professional aircraft detailing services

**Billing & Payments**
- 💳 Stripe-powered invoice payment processing
- 📄 Invoice history and detailed tracking
- 💰 Transparent 3-tier pricing (Class I, II, III)
- 🏢 Hangar location selection (Freedom Aviation or Sky Harbour)
- 🎫 Membership credit management
- 📧 Automated billing notifications
- 🧮 Interactive pricing calculator

### 👨‍✈️ For Flight Instructors (CFIs)

**Schedule Management**
- 📅 CFI schedule management dashboard
- 🗓️ Google Calendar two-way synchronization
- 🔄 Automatic event sync with color coding (available/booked/blocked)
- ⏰ Manual and automatic sync options
- 📆 Calendar selection support

**Client & Instruction Management**
- 👥 Student/client tracking and records
- 📊 Instruction request handling workflow
- 💵 Invoice creation for flight instruction
- ✉️ Automated email notifications for new requests
- 🎯 Staff-level access to operations dashboard

### 🎯 For Operations Staff & Administrators

**Operations Management**
- 📋 Kanban board for service request workflow (open → in progress → completed)
- 🏃 Drag-and-drop task management
- 👥 Complete client and aircraft oversight
- 📈 Operations dashboard with real-time metrics
- 🔍 Advanced filtering and search capabilities
- 📧 Automated email notifications for new service requests
- 👨‍💼 Role-based notification preferences (ops, cfi, staff, admin, founder)

**Configuration & Setup**
- ⚙️ Unified pricing configurator
- 💰 Multi-tier pricing management (Class I, II, III)
- 📍 Location-based hangar pricing (Freedom Aviation $0, Sky Harbour +$2,000/mo)
- 🏗️ Monthly flight hour bands (0-10, 10-20, 20-50 hours)
- 👤 User role management (6 tiers)
- 🎛️ System settings and configuration
- 🎨 Brand customization

**Reporting & Analytics**
- 📊 Service metrics and KPIs
- 💵 Revenue tracking and forecasting
- ⏰ Hour band analysis
- 📈 Margin calculations
- 📉 Usage patterns

### 🔐 Security & Authentication

**Authentication Methods**
- 🔒 Supabase Auth (email/password)
- 🌐 Google OAuth 2.0 sign-in
- 🔑 JWT-based session management
- 🔄 Automatic token refresh
- 🍪 Secure HTTP-only cookie handling
- 🚪 Password reset flow

**Authorization & Access Control**
- 🛡️ Row Level Security (RLS) on all 45+ database tables
- 🎭 Six-tier role system:
  - **Owner**: Aircraft owners with personal dashboard access
  - **CFI**: Flight instructors with schedule and student management
  - **Staff**: General staff with view-only operations access
  - **Ops**: Operations staff with service request management
  - **Admin**: Full system administration capabilities
  - **Founder**: Super admin with customizable notification preferences
- 🔐 Policy-based data access (users see only authorized data)
- 🔒 Service role key for elevated operations

### 📱 Mobile & Progressive Web App

**PWA Features**
- 📲 Installable on iOS, Android, and desktop
- 🔄 Offline capability (service worker)
- 📱 App manifest with proper icons
- 🚀 Fast loading and caching
- 🎨 Standalone display mode
- 📳 Push notification support (planned)

**Native iOS App**
- 🍎 Built with Capacitor
- 📱 App ID: `com.freedomaviation.app`
- 🎨 Custom splash screen
- 🔗 Deep linking support
- 🌐 Navigation allowed domains (localhost, freedomaviation.com, supabase.co)
- 📦 Xcode project included in `ios/` directory

### 🔧 Technical Excellence

**Performance**
- ⚡ Vite 5.4 build system with HMR
- 📦 Code splitting and lazy loading
- 💾 TanStack Query v5 for data fetching and caching
- 🔄 Optimistic UI updates
- ⚡ Lighthouse score 90+ (Performance, Accessibility, Best Practices, SEO)
- 🚀 Fast page loads (<2s)
- 🎯 Efficient re-renders with React 18

**iOS Native App (via Capacitor)**
- 📱 Native iOS app with web technologies
- 🍎 App Store ready
- 📸 Camera and photo library access
- 🔔 Push notifications support
- 🔐 OAuth redirects via custom URL scheme
- 🎨 Native splash screen and icons

**Developer Experience**
- 📘 TypeScript 5.6 throughout (strict mode)
- 🎨 Tailwind CSS 3.4 + shadcn/ui component library
- 🧪 Vitest + Testing Library for unit/integration tests
- 🔍 Type-safe database queries with generated types
- 📝 Comprehensive documentation (25+ docs)
- 🔧 Hot module replacement (HMR)
- 🛠️ ESLint + Prettier configured
- 🐛 Runtime error overlays in development
- 📊 Test UI and coverage reports

**Database & Backend**
- 🗄️ PostgreSQL 16 (via Supabase)
- 🔄 Drizzle ORM integration
- 📜 45+ tables with complete schema
- 🔐 Row Level Security on all tables
- 🪝 Database triggers (user creation, maintenance alerts)
- 🔗 Foreign key relationships and constraints
- 📊 Indexes for performance optimization
- 💾 Automatic timestamps and UUIDs
- 🌿 Branching: Main (production) + Preview (staging)

**Email Notifications**
- 📧 Resend email service integration
- 📬 Email notification queue system
- 🎨 Professional HTML email templates
- 🔔 Notification types: service requests, flight instruction, billing
- ⚙️ Per-role notification preferences
- 🔄 Manual and automatic processing
- 🪝 Supabase webhook support for instant delivery
- 📊 Email status tracking (pending, sent, failed)

**SEO & Discoverability**
- 🔍 Optimized for Colorado aviation market
- 📍 Local SEO (Centennial Airport, KAPA, Denver, Front Range)
- 🌐 Structured data (Organization, LocalBusiness, Service, FAQPage)
- 🗺️ XML sitemap with priorities
- 🤖 Robots.txt with proper directives
- 📊 Open Graph and Twitter Card meta tags
- 🎯 Geographic meta tags (region, placename, coordinates)
- 🔗 Schema.org JSON-LD markup
- 📱 Mobile-first responsive design
- ⚡ Core Web Vitals optimized

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account ([Sign up free](https://supabase.com))
- (Optional) Stripe account for payments

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FreedomAviation-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Set up database**
   - Open [Supabase Dashboard](https://supabase.com/dashboard)
   - Run `supabase-schema.sql` in SQL Editor
   - Run `scripts/setup-admin.sql` to create admin user

5. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:5000

## Documentation

Comprehensive documentation is organized in the **[docs/](docs/)** directory.

### 🚀 Quick Start Guides
- **[Getting Started](docs/development/getting-started.md)** - Complete development environment setup
- **[Deployment Guide](docs/development/deployment.md)** - Production deployment procedures
- **[Troubleshooting](docs/development/troubleshooting.md)** - Common issues and solutions
- **[iOS Setup Guide](docs/IOS_SETUP.md)** - 📱 Build and deploy the iOS app
- **[ENV Configuration Guide](ENV_CONFIGURATION_GUIDE.md)** - Environment variable setup

### 🏗️ Architecture & Database (45+ Tables)
- **[Database Schema](docs/architecture/database-schema.md)** - Complete database reference with RLS policies
- **[Schema Reference](docs/architecture/schema-reference.md)** - Detailed schema documentation with relationships
- **[Schema Integration Report](docs/architecture/SCHEMA_INTEGRATION_FINAL_REPORT.md)** - Integration status
- **[Database Migrations](migrations/README.md)** - 19 migration scripts with execution order
- **[Complete Integration Summary](COMPLETE_INTEGRATION_SUMMARY.md)** - Full integration details

### 🔐 Authentication & Security
- **[Supabase Auth Production Guide](docs/development/auth/SUPABASE_AUTH_PRODUCTION_GUIDE.md)** - Complete auth setup
- **[Auth Deployment Guide](docs/development/auth/DEPLOY_AUTH_FIXES.md)** - Quick deployment steps
- **[Auth Fixes Summary](docs/development/auth/AUTH_FIXES_SUMMARY.md)** - Recent fixes overview
- **[Auth Flow Diagram](docs/development/auth/AUTH_FLOW_DIAGRAM.md)** - Visual authentication flow

### ⚙️ Setup & Configuration
- **[Email Configuration](docs/setup/EMAIL_CONFIGURATION.md)** - Resend email service setup
- **[Stripe Configuration](docs/setup/stripe-configuration.md)** - Payment processing configuration
- **[Email Templates](docs/setup/email-templates/)** - HTML email templates

### ✨ Features
- **[Google Integration](docs/features/google-integration.md)** - OAuth 2.0 and Calendar sync
- **[SEO Strategy](docs/features/seo-strategy.md)** - Search engine optimization for Colorado market
- **[Pricing System](docs/features/pricing.md)** - 3-tier pricing, hangar locations, calculator
- **[Roles & Notifications](docs/ROLES_AND_NOTIFICATIONS.md)** - 6-tier role system and email notifications

### 🎨 Design & Development
- **[Design Guidelines](docs/design/guidelines.md)** - Design system, UI principles, brand colors
- **[Contributing Guide](CONTRIBUTING.md)** - Development workflow, code standards, PR process
- **[Utility Scripts](scripts/README.md)** - 43 database and deployment scripts

### 📋 Session & Integration Reports
- **[Session Complete Summary](SESSION_COMPLETE_SUMMARY.md)** - Latest session work
- **[Complete Integration Summary](COMPLETE_INTEGRATION_SUMMARY.md)** - Branch integration status
- **[Migration History](MIGRATION_HISTORY_FIXED.md)** - Migration timeline
- **[Next Steps](NEXT_STEPS.md)** - Upcoming tasks and priorities

### Documentation Structure

```
docs/
├── README.md                       # Documentation index
├── ROLES_AND_NOTIFICATIONS.md      # User roles and email system
├── architecture/                   # System architecture (4 files)
│   ├── database-schema.md
│   ├── schema-reference.md
│   └── SCHEMA_INTEGRATION_FINAL_REPORT.md
├── development/                    # Development guides (22 files)
│   ├── getting-started.md
│   ├── deployment.md
│   ├── troubleshooting.md
│   ├── database-migrations.md
│   └── auth/                       # Authentication (6 files)
│       ├── SUPABASE_AUTH_PRODUCTION_GUIDE.md
│       └── ...
├── features/                       # Feature documentation (3 files)
│   ├── google-integration.md
│   ├── pricing.md
│   └── seo-strategy.md
├── setup/                          # Configuration guides (11 files)
│   ├── EMAIL_CONFIGURATION.md
│   ├── stripe-configuration.md
│   └── email-templates/           # HTML email templates
└── design/                         # Design guidelines (1 file)
    └── guidelines.md
```

**Root-level Documentation Files:**
- `README.md` - This file (project overview)
- `CONTRIBUTING.md` - Contribution guidelines
- `ENV_CONFIGURATION_GUIDE.md` - Environment setup
- `COMPLETE_INTEGRATION_SUMMARY.md` - Integration report
- `SESSION_COMPLETE_SUMMARY.md` - Session summary
- `MIGRATION_HISTORY_FIXED.md` - Migration timeline
- `NEXT_STEPS.md` - Upcoming priorities
- `LICENSE` - MIT License

⚠️ **Documentation Policy**: Do not create new documentation files in the project root. Use appropriate `docs/` subdirectories.

## Tech Stack

### Frontend
- **React 18.3** - Modern UI framework with concurrent features
- **TypeScript 5.6** - Type-safe development with strict mode
- **Vite 5.4** - Lightning-fast build tool with HMR
- **Wouter 3.3** - Lightweight routing (<2KB)
- **TanStack Query 5.60** - Powerful async state management
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible component library (40+ components)
- **Framer Motion 11** - Smooth animations
- **Recharts 2.15** - Data visualization
- **React Hook Form 7.55** - Form management with validation
- **Zod 3.24** - Schema validation
- **React Helmet Async** - SEO and meta tag management
- **Lucide React** - Modern icon library (450+ icons)

### Backend
- **Node.js 20** - JavaScript runtime
- **Express.js 4.21** - HTTP server and API framework
- **TypeScript (tsx)** - Server-side TypeScript execution
- **Supabase 2.75** - Backend-as-a-Service
- **PostgreSQL 16** - Relational database with advanced features
- **Drizzle ORM 0.39** - Type-safe database queries
- **Stripe 19.2** - Payment processing
- **Google APIs 165** - OAuth and Calendar integration
- **Resend** - Transactional email service
- **Express Session** - Session management
- **CORS** - Cross-origin resource sharing

### Infrastructure & DevOps
- **Vercel** - Hosting, serverless functions, and deployment
- **Supabase Cloud** - Managed PostgreSQL with real-time subscriptions
- **Git** - Version control with branching strategy
- **npm** - Package management
- **Capacitor** - Native iOS app wrapper

### Development Tools
- **Vitest 4.0** - Unit and integration testing
- **Testing Library** - React component testing
- **Happy DOM** - Fast DOM implementation for tests
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking
- **Vite Dev Server** - Development server with HMR

### Monitoring & Analytics (Configured)
- **Google Analytics** (ready)
- **Google Search Console** (configured)
- **Stripe Dashboard** - Payment analytics
- **Supabase Logs** - Database and API logs
- **Vercel Analytics** - Performance monitoring

## Project Structure

```
FreedomAviation-1/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── pages/             # Page components (25 routes)
│   │   │   ├── home.tsx       # Landing page
│   │   │   ├── login.tsx      # Authentication
│   │   │   ├── pricing.tsx    # Pricing calculator
│   │   │   ├── onboarding.tsx # New user onboarding
│   │   │   ├── owner-dashboard.tsx
│   │   │   ├── staff-dashboard.tsx
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── dashboard/     # Owner sub-pages
│   │   │   ├── staff/         # Staff sub-pages
│   │   │   └── admin/         # Admin pages
│   │   ├── components/        # Reusable UI components (103 files)
│   │   │   ├── ui/            # shadcn/ui components (40+)
│   │   │   ├── hero-section.tsx
│   │   │   ├── features-grid.tsx
│   │   │   ├── aircraft-card.tsx
│   │   │   ├── service-request-form.tsx
│   │   │   ├── pricing-calculator.tsx
│   │   │   └── ...
│   │   ├── lib/               # Utilities and configurations (29 files)
│   │   │   ├── supabase.ts    # Supabase client
│   │   │   ├── auth-context.tsx # Auth provider
│   │   │   ├── stripe.ts      # Stripe integration
│   │   │   ├── utils.ts       # Helper functions
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks (12 files)
│   │   │   ├── use-auth.ts
│   │   │   ├── use-aircraft.ts
│   │   │   ├── use-service-requests.ts
│   │   │   └── ...
│   │   ├── seo/               # SEO utilities (3 files)
│   │   │   ├── keywords.ts
│   │   │   ├── local-seo.ts
│   │   │   └── structured-data.ts
│   │   ├── features/          # Feature modules (8 files)
│   │   ├── types/             # TypeScript type definitions
│   │   ├── brand/             # Brand configuration
│   │   ├── App.tsx            # Root component
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── public/                # Static assets
│   │   ├── icons/             # PWA icons
│   │   ├── favicon.png
│   │   ├── manifest.webmanifest
│   │   └── sw.js              # Service worker
│   └── index.html             # HTML template
├── server/                    # Express.js backend
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API routes
│   ├── vite.ts                # Vite integration
│   ├── auth-proxy.ts          # Auth middleware
│   └── lib/                   # Server utilities (7 files)
│       ├── google-calendar.ts # Google Calendar service
│       ├── email-service.ts   # Email notifications
│       ├── stripe-service.ts  # Stripe integration
│       └── ...
├── shared/                    # Shared TypeScript types
│   ├── schema.ts              # Drizzle schema (legacy)
│   ├── database-types.ts      # Generated Supabase types (45+ tables)
│   └── supabase-types.ts      # Additional type definitions
├── ios/                       # Native iOS app (Capacitor)
│   ├── App/
│   │   ├── App.xcodeproj/     # Xcode project
│   │   ├── App/               # iOS source files
│   │   ├── Podfile.lock
│   │   └── capacitor.config.json
│   └── capacitor-cordova-ios-plugins/
├── scripts/                   # Utility scripts (43 files)
│   ├── SQL migrations (22 files)
│   │   ├── setup-admin.sql
│   │   ├── add-google-calendar-integration.sql
│   │   ├── add-email-triggers.sql
│   │   └── ...
│   ├── Database utilities (11 .mjs)
│   │   ├── test-main-integration.mjs
│   │   ├── test-preview-integration.mjs
│   │   ├── verify-env-config.mjs
│   │   └── ...
│   └── Shell scripts (6 .sh)
│       ├── apply-onboarding-rls-fix.sh
│       ├── connect-to-supabase.sh
│       └── ...
├── migrations/                # Database migrations (19 files)
│   ├── safe_schema_setup.sql
│   ├── add_user_roles.sql
│   ├── fix_rls_policies_EMERGENCY.sql
│   ├── create_notifications_table.sql
│   └── README.md
├── supabase/                  # Supabase configuration
│   ├── config.toml            # Supabase CLI config
│   └── migrations/            # Managed migrations (7 files)
│       ├── 20251121000000_create_onboarding_data_table.sql
│       ├── 20251121000001_fix_onboarding_rls.sql
│       └── ...
├── docs/                      # Documentation (25+ files)
│   ├── README.md              # Documentation index
│   ├── ROLES_AND_NOTIFICATIONS.md
│   ├── architecture/          # System architecture
│   │   ├── database-schema.md
│   │   ├── schema-reference.md
│   │   └── SCHEMA_INTEGRATION_FINAL_REPORT.md
│   ├── development/           # Development guides (22 files)
│   │   ├── getting-started.md
│   │   ├── deployment.md
│   │   ├── troubleshooting.md
│   │   ├── database-migrations.md
│   │   └── auth/              # Authentication docs
│   │       ├── SUPABASE_AUTH_PRODUCTION_GUIDE.md
│   │       └── ...
│   ├── features/              # Feature documentation
│   │   ├── google-integration.md
│   │   ├── pricing.md
│   │   └── seo-strategy.md
│   ├── setup/                 # Configuration guides (11 files)
│   │   ├── email-configuration.md
│   │   ├── stripe-configuration.md
│   │   └── ...
│   └── design/                # Design guidelines
│       └── guidelines.md
├── public/                    # Production static files
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── images/
│   └── videos/
├── dist/                      # Production build output
├── attached_assets/           # Design assets and archives
│   ├── falogo.png
│   ├── stock_images/
│   └── ...
├── .env.local                 # Development environment variables
├── env.local.example          # Environment template
├── .env.preview               # Preview branch environment (create manually)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── vitest.config.ts           # Vitest test configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── drizzle.config.ts          # Drizzle ORM configuration
├── vercel.json                # Vercel deployment config
├── supabase-schema.sql        # Complete database schema
├── README.md                  # This file
├── CONTRIBUTING.md            # Contribution guidelines
├── ENV_CONFIGURATION_GUIDE.md # Environment setup guide
├── COMPLETE_INTEGRATION_SUMMARY.md # Integration report
└── SESSION_COMPLETE_SUMMARY.md # Session summary
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload (port 5000)
                        # Uses tsx with .env.local

# Building
npm run build           # Production build (outputs to dist/public/)
                        # Includes Vite optimization and code splitting
npm run check           # TypeScript type check (no emit)

# Testing
npm run test            # Run Vitest test suite once
npm run test:watch      # Run tests in watch mode (auto-rerun on changes)
npm run test:ui         # Open Vitest UI in browser
npm run test:coverage   # Generate coverage report (HTML + terminal)

# iOS (Capacitor)
npm run cap:sync     # Build web app and sync to all platforms
npm run cap:sync:ios # Build web app and sync to iOS
npm run cap:open:ios # Open iOS project in Xcode
npm run cap:run:ios  # Build, sync, and open iOS in Xcode
npm run cap:add:ios  # Add iOS platform (already done)

# Production
npm start               # Start production server
                        # Uses tsx with .env.production

# Database
npm run db:push         # Push Drizzle schema to database (use with caution)

# Utility Scripts (via node)
node scripts/test-main-integration.mjs        # Test main branch integration
node scripts/test-preview-integration.mjs     # Test preview branch
node scripts/verify-env-config.mjs            # Verify environment variables
node scripts/apply-preview-migrations.mjs     # Apply migrations to preview
node scripts/fix-preview-branch.mjs           # Fix preview branch issues
```

### Script Details

**Development Server (`npm run dev`)**
- Runs on http://localhost:5000
- Hot Module Replacement (HMR) enabled
- TypeScript compilation on-the-fly
- Loads `.env.local` automatically
- Vite dev server with React Fast Refresh

**Production Build (`npm run build`)**
- Outputs to `dist/public/`
- Minification and tree-shaking
- Code splitting by route
- Asset optimization
- Source maps generation
- PWA service worker generation

**Type Checking (`npm run check`)**
- Validates all TypeScript files
- Checks for type errors
- No output files generated
- Useful for CI/CD pipelines

**Testing (`npm run test`)**
- Uses Vitest test runner
- React Testing Library for component tests
- Happy DOM for fast DOM simulation
- Coverage reports with Istanbul
- Watch mode for development

**Database Scripts**
- Integration tests verify database connectivity and RLS policies
- Migration scripts apply SQL files to Supabase
- Environment verification ensures correct configuration

## Environment Variables

### Development (`.env.local`)

Required variables for local development:

```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe (Required for payments)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google OAuth & Calendar (Optional)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google-calendar/callback

# Email Notifications (Optional - Resend)
EMAIL_SERVICE=resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="Freedom Aviation <notifications@freedomaviationco.com>"

# Email API Protection
EMAIL_NOTIFICATIONS_API_KEY=your-secure-api-key

# Webhook Secrets
SUPABASE_WEBHOOK_SECRET=your-webhook-secret

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Production (Vercel Environment Variables)

⚠️ **Critical**: In Vercel serverless functions, `VITE_` prefixed variables are NOT available at runtime (only during build).

**You must set BOTH versions** in Vercel Dashboard → Settings → Environment Variables:

```env
# For client-side (build time) - Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# For server-side (runtime) - Required for API routes
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_live_...

# Google Integration
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google-calendar/callback

# Email Service (Production)
EMAIL_SERVICE=resend
RESEND_API_KEY=re_live_...
EMAIL_FROM="Freedom Aviation <notifications@freedomaviationco.com>"
EMAIL_NOTIFICATIONS_API_KEY=your-production-api-key

# Webhooks
SUPABASE_WEBHOOK_SECRET=your-production-webhook-secret

# Optional
NODE_ENV=production
```

### Preview Branch (`.env.preview`)

Create this file manually for testing against preview branch:

```env
# Supabase Preview Branch (frarfaidvppulsemvogd)
VITE_SUPABASE_URL=https://frarfaidvppulsemvogd.supabase.co
VITE_SUPABASE_ANON_KEY=preview_anon_key
SUPABASE_SERVICE_ROLE_KEY=preview_service_role_key

# Use test Stripe keys
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Rest same as development
```

### Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (client-side) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (client-side) |
| `SUPABASE_URL` | Production | Supabase URL for server-side (runtime) |
| `SUPABASE_ANON_KEY` | Production | Anon key for server-side (runtime) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (bypasses RLS) |
| `STRIPE_SECRET_KEY` | Yes* | Stripe secret key (sk_test or sk_live) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes* | Stripe publishable key (pk_test or pk_live) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Optional | OAuth callback URL |
| `EMAIL_SERVICE` | Optional | Email service (resend or console) |
| `RESEND_API_KEY` | Optional | Resend API key for emails |
| `EMAIL_FROM` | Optional | From address for emails |
| `EMAIL_NOTIFICATIONS_API_KEY` | Optional | API key for email processing endpoint |
| `SUPABASE_WEBHOOK_SECRET` | Optional | Webhook verification secret |
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | Environment (development/production) |

*Required for payment features

See `env.local.example` for complete template with descriptions.

## Routes

### Public Routes (No authentication required)

| Route | Description | Features |
|-------|-------------|----------|
| `/` | Homepage | Hero section, features grid, testimonials, pricing preview, SEO optimized |
| `/pricing` | Pricing calculator | Interactive 3-tier pricing, hangar selection, hour bands, transparent costs |
| `/hangars` | Hangar locations map | Freedom Aviation ($0) vs Sky Harbour (+$2,000), features comparison |
| `/contact` | Contact form | FormSubmit integration, business info, Google Maps embed |
| `/about` | About page | Company story, team, mission, values |
| `/login` | Authentication | Email/password + Google OAuth sign-in, password reset link |
| `/forgot-password` | Password reset request | Email-based password reset flow |
| `/reset-password` | Password reset confirmation | Token-based password update |

*Note*: `/hangar-locations` redirects to `/hangars`

### Protected Routes - Owner (Requires authentication)

| Route | Description | Features |
|-------|-------------|----------|
| `/dashboard` | Owner dashboard | Aircraft overview, maintenance status, recent service requests, quick actions |
| `/dashboard/aircraft` | Aircraft management | Multi-aircraft tracking, images, Hobbs/Tach hours, fuel monitoring |
| `/dashboard/members` | Membership details | Tier info, credits, billing history, plan management |
| `/dashboard/settings` | Account settings | Profile editing, password change, notification preferences |
| `/dashboard/more` | Additional settings | Billing, support, logout |
| `/onboarding` | New user onboarding | Step-by-step setup flow for new members |

### Protected Routes - Staff/Admin (Requires staff, ops, cfi, admin, or founder role)

| Route | Description | Roles | Features |
|-------|-------------|-------|----------|
| `/staff` or `/admin` | Staff home dashboard | All staff | Activity overview, quick stats, recent updates |
| `/staff/manage` | Kanban board | staff, ops, admin, founder | Service request workflow (open → in progress → completed), drag-and-drop |
| `/staff/members` | Client management | staff, admin, founder | Client list, aircraft roster, user management |
| `/staff/aircraft` | Aircraft oversight | staff, ops, admin, founder | All aircraft, maintenance tracking, owner assignments |
| `/staff/operations` | Operations dashboard | ops, admin, founder | Metrics, analytics, service stats, revenue tracking |
| `/staff/settings` | Staff settings | All staff | Staff-specific configuration |

*Note*: Staff routes work with both `/staff/*` and `/admin/*` prefixes

### CFI-Specific Routes

| Route | Description | Features |
|-------|-------------|----------|
| `/staff/schedule` | CFI schedule management | Google Calendar sync, availability slots, booking management |
| `/staff/students` | Student tracking | Student list, instruction records, progress tracking |

### API Routes

#### Stripe Integration
- `POST /api/stripe/create-checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler (payment events)
- `POST /api/stripe/create-payment-intent` - Create payment intent for invoices

#### Google Calendar Integration
- `GET /api/google-calendar/auth-url` - Get OAuth authorization URL
- `GET /api/google-calendar/callback` - OAuth callback handler
- `GET /api/google-calendar/status` - Check connection status
- `POST /api/google-calendar/disconnect` - Disconnect calendar
- `POST /api/google-calendar/toggle-sync` - Enable/disable auto-sync
- `POST /api/google-calendar/sync-slot` - Sync single calendar slot
- `POST /api/google-calendar/sync-all` - Sync all slots

#### Email Notifications
- `POST /api/email-notifications/process` - Process pending email notifications (requires API key)
- `POST /api/webhooks/email-notification` - Supabase webhook for instant email processing

#### Health & Status
- `GET /api/health` - Server health check
- `GET /api/auth/session` - Get current session info

## Deployment

### Deployment Strategy

**Branches & Environments:**
- **`main`** → Production ([freedomaviationco.com](https://freedomaviationco.com))
- **`preview`** → Staging/testing environment (separate Supabase branch)
- **`feature/*`** → Feature branches (Vercel auto-preview)

**Database Branches:**
- **Main**: `wsepwuxkwjnsgmkddkjw` (production)
- **Preview**: `frarfaidvppulsemvogd` (staging)

### Deploying to Production (Web)

#### 1. Test on Preview First
```bash
# Ensure you're on preview branch
git checkout preview

# Test locally with preview environment
cp .env.preview .env.local
npm run dev

# Run integration tests
node scripts/test-preview-integration.mjs
```

#### 2. Apply Database Migrations

**To Preview Branch:**
```bash
# Get preview credentials
supabase branches get preview --output json

# Apply migration
PGPASSWORD="pBpnnuwOggHCVXKWtNdgFljjzMCdfSni" psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.frarfaidvppulsemvogd \
  -d postgres \
  -f supabase/migrations/your-migration.sql
```

**To Main Branch (after testing):**
```bash
# Get main credentials
supabase branches get main --output json

# Apply same migration
PGPASSWORD="xxx" psql \
  -h [main-pooler-host] \
  -p 6543 \
  -U postgres.wsepwuxkwjnsgmkddkjw \
  -d postgres \
  -f supabase/migrations/your-migration.sql

# Verify
node scripts/test-main-integration.mjs
```

#### 3. Merge and Deploy
```bash
# Merge to main
git checkout main
git merge preview
git push origin main

# Vercel automatically deploys main branch
# Monitor deployment at https://vercel.com/dashboard
```

#### 4. Post-Deployment Checklist
- [ ] Verify deployment successful in Vercel
- [ ] Test authentication flow
- [ ] Check database connections
- [ ] Verify API routes working
- [ ] Test Stripe payments (use test mode first)
- [ ] Confirm email notifications sending
- [ ] Check Google Calendar sync (if enabled)
- [ ] Monitor Vercel logs for errors
- [ ] Test key user flows (owner dashboard, service requests)

### Environment Variables in Vercel

1. **Access Settings**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Settings → Environment Variables

2. **Add Required Variables**
   - Set all variables from "Environment Variables" section above
   - Use **Production** environment for `main` branch
   - Use **Preview** environment for `preview` branch
   - Set **Development** for local testing

3. **Important Notes**
   - Always set BOTH `VITE_*` and non-prefixed versions for Supabase/Stripe
   - Use production keys (`sk_live_`, `pk_live_`) for production
   - Use test keys (`sk_test_`, `pk_test_`) for preview/development
   - Never commit secrets to git

4. **Redeploy After Changes**
   - Changes to environment variables require redeployment
   - Deployments → ⋯ Menu → Redeploy

### Custom Domain Configuration

1. **Add Domain in Vercel**
   - Project Settings → Domains
   - Add `freedomaviationco.com` and `www.freedomaviationco.com`
   - Configure DNS records as instructed

2. **Update Supabase Redirect URLs**
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URL: `https://freedomaviationco.com`
   - Redirect URLs: Add production domains

3. **Update Google OAuth**
   - Google Cloud Console → Credentials
   - Authorized redirect URIs: Add production callback URL
   - `https://freedomaviationco.com/api/google-calendar/callback`

4. **Update Stripe Webhooks**
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://freedomaviationco.com/api/stripe/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.failed`, etc.

### Rollback Procedure

If deployment has critical issues:

```bash
# Revert git commit
git revert HEAD
git push origin main

# Or rollback in Vercel
# Vercel Dashboard → Deployments → Previous deployment → Promote to Production
```

### Monitoring & Logs

- **Vercel Logs**: Real-time function logs
- **Supabase Logs**: Database queries and errors
- **Stripe Dashboard**: Payment events and webhooks
- **Google Search Console**: SEO and indexing

### Performance Optimization

- ✅ Vite build optimizations enabled
- ✅ Code splitting configured
- ✅ Image optimization (lazy loading)
- ✅ Service worker for caching
- ✅ Gzip compression enabled
- ✅ CDN via Vercel Edge Network

### iOS App Deployment

The native iOS app is built with Capacitor:

```bash
# Build web assets
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# Build and deploy via Xcode
# (requires Apple Developer account)
```

## Database Schema

Freedom Aviation uses PostgreSQL 16 via Supabase with comprehensive Row Level Security.

### Core Tables (45+ total)

#### User Management
- **`user_profiles`** - Extended user data (links to `auth.users`)
  - Columns: `id`, `email`, `full_name`, `role`, `phone`, `created_at`, `updated_at`
  - Roles: `owner`, `cfi`, `staff`, `ops`, `admin`, `founder`
  - RLS: Users see own profile; admins see all

- **`notification_preferences`** - Per-user notification settings (for founders)
  - Columns: `user_id`, `service_requests`, `flight_instruction`, `billing`, `enabled`

#### Aircraft & Ownership
- **`aircraft`** - Aircraft registry
  - Columns: `id`, `tail_number` (unique), `make`, `model`, `year`, `class`, `hobbs_hours`, `tach_hours`, `owner_id`, `image_url`
  - RLS: Owners see their aircraft; staff/CFI see all

- **`memberships`** - Membership plans and billing
  - Columns: `id`, `user_id`, `aircraft_id`, `class`, `monthly_rate`, `active`, `start_date`, `end_date`
  - Classes: Class I ($1,800+), Class II ($2,200+), Class III ($3,500+)

- **`membership_quotes`** - Custom pricing quotes
  - For non-standard aircraft or special requirements

#### Maintenance & Service
- **`maintenance`** - Maintenance tracking
  - Columns: `id`, `aircraft_id`, `item_name`, `due_date`, `due_hobbs`, `due_tach`, `status`, `notes`, `completed_date`
  - Status: `current`, `due_soon`, `overdue`
  - Tracks calendar, hobbs, and tach-based maintenance

- **`service_requests`** - Service request queue
  - Columns: `id`, `aircraft_id`, `owner_id`, `service_type`, `description`, `priority`, `status`, `requested_date`, `assigned_to`, `estimated_cost`, `actual_cost`
  - Priority: `low`, `medium`, `high`, `urgent`
  - Status: `open`, `in_progress`, `completed`, `cancelled`
  - RLS: Owners see own; staff see all

- **`flight_logs`** - Flight history
  - Tracks hobbs, tach, fuel usage, and flight details

#### Billing & Payments
- **`invoices`** - Invoice records
  - Columns: `id`, `user_id`, `aircraft_id` (optional), `amount`, `status`, `due_date`, `paid_date`, `stripe_payment_intent_id`
  - Status: `pending`, `paid`, `overdue`, `cancelled`

- **`payments`** - Payment history
  - Tracks Stripe payment transactions

#### CFI & Scheduling
- **`cfi_schedule`** - CFI availability
  - Columns: `id`, `cfi_id`, `date`, `start_time`, `end_time`, `status`, `owner_id`, `aircraft_id`, `notes`, `google_calendar_event_id`
  - Status: `available`, `booked`, `blocked`
  - Syncs with Google Calendar

- **`google_calendar_tokens`** - OAuth tokens
  - Columns: `user_id` (unique), `access_token`, `refresh_token`, `token_expiry`, `calendar_id`, `sync_enabled`, `last_sync_at`
  - RLS: Users access only their own tokens
  - Encrypted token storage

#### Pricing Configuration
- **`pricing_locations`** - Hangar locations
  - Freedom Aviation Hangar: $0/month (included)
  - Sky Harbour: +$2,000/month (premium upgrade)

- **`membership_tiers`** - Tier definitions
  - Class I, II, III with features and base rates

- **`hour_bands`** - Flight hour pricing bands
  - 0-10 hours, 10-20 hours, 20-50 hours

#### Notifications
- **`email_notifications`** - Email queue
  - Columns: `id`, `recipient_email`, `subject`, `body_html`, `notification_type`, `status`, `sent_at`, `error_message`
  - Status: `pending`, `sent`, `failed`
  - Types: `service_request`, `flight_instruction`, `invoice`, `maintenance_due`

- **`notifications`** - In-app notifications (future)

#### Onboarding
- **`onboarding_data`** - New user onboarding progress
  - Tracks step completion and collected data

### Database Features

**Row Level Security (RLS)**
- Enabled on all tables
- Policy-based access control
- Role-based filtering
- Owner isolation (users only see their data)
- Staff/admin bypass for oversight

**Triggers**
- `on_auth_user_created` - Auto-create user_profile on signup
- Maintenance status updates based on hobbs/tach/date
- Email notification queue on service request creation

**Indexes**
- `aircraft.owner_id` - Fast owner lookups
- `aircraft.tail_number` - Unique aircraft identification
- `memberships.user_id` - Membership queries
- `service_requests.status` - Status filtering
- `service_requests.owner_id` - Owner service requests
- `cfi_schedule.cfi_id` - CFI schedule lookups
- `cfi_schedule.date` - Date-based queries

**Foreign Keys**
- Cascade deletes configured appropriately
- Referential integrity enforced
- Relationships between users, aircraft, services

### Schema Files

- **`supabase-schema.sql`** - Base schema (core tables)
- **`shared/database-types.ts`** - TypeScript types (45+ tables)
- **`docs/architecture/database-schema.md`** - Complete schema documentation
- **`docs/architecture/schema-reference.md`** - Detailed reference guide
- **`migrations/`** - 19 migration scripts with order guide
- **`supabase/migrations/`** - Managed migrations (7 files)

### Migration Management

**Migration Order** (see `migrations/README.md`):
1. Base schema setup
2. RLS policies
3. User roles and permissions
4. Feature-specific tables
5. Email notifications
6. Google Calendar integration
7. Pricing system updates

**Testing Migrations:**
```bash
# Test on preview first
node scripts/test-preview-integration.mjs

# Apply to main after validation
node scripts/test-main-integration.mjs
```

See **[Database Schema Documentation](docs/architecture/database-schema.md)** for complete details.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Contribution Guide

1. **Fork the repository** (if external contributor)
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow TypeScript and React best practices
   - Write tests for new features
   - Update documentation as needed
4. **Commit with conventional commits**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
5. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open Pull Request**
   - Use clear, descriptive title
   - Describe what changed and why
   - Reference any related issues
   - Add screenshots for UI changes

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, semicolons, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process, dependencies

**Examples:**
```bash
feat(auth): add Google OAuth sign-in
fix(dashboard): resolve aircraft not loading issue
docs(readme): update installation instructions
refactor(pricing): simplify tier calculation logic
test(service-requests): add integration tests
chore(deps): update dependencies to latest versions
```

### Development Guidelines

#### Code Style
- ✅ Use TypeScript (no `any` types)
- ✅ Follow ESLint rules
- ✅ Use functional components with hooks
- ✅ Prefer composition over inheritance
- ✅ Write clear, descriptive names
- ✅ Add comments for complex logic
- ✅ Keep functions small and focused

#### Testing Requirements
- ✅ Write tests for new features
- ✅ Maintain >80% code coverage
- ✅ Test with different user roles
- ✅ Verify mobile responsiveness
- ✅ Check browser compatibility

#### Documentation Requirements
- ✅ Update README if adding major features
- ✅ Document new API endpoints
- ✅ Add JSDoc comments for functions
- ✅ Update relevant docs/ files
- ✅ Include examples in documentation

### Areas Open for Contribution

**High Priority:**
- 📱 Enhanced mobile features
- 🔔 Push notifications
- 📊 Advanced analytics dashboards
- 🎨 UI/UX improvements
- ♿ Accessibility enhancements
- 🧪 Additional test coverage
- 📝 Documentation improvements

**Feature Requests:**
- 💬 In-app messaging
- 📅 Recurring service scheduling
- 📈 Custom reporting
- 🔄 Third-party integrations
- 🌐 Multi-language support (i18n)
- 🎯 Advanced search/filtering

### Questions?

- Check existing documentation in `docs/`
- Review similar code in the codebase
- Ask in pull request comments
- Contact: info@freedomaviationco.com

## Security

### Authentication & Authorization
- 🔐 **Supabase Auth**: Industry-standard JWT authentication
- 🔑 **Multiple Auth Methods**: Email/password + Google OAuth 2.0
- 🔒 **Password Requirements**: Minimum 8 characters, complexity enforced
- 🔄 **Token Refresh**: Automatic session renewal
- 🍪 **Secure Cookies**: HTTP-only, SameSite, Secure flags
- 🚪 **Password Reset**: Secure email-based flow
- ⏰ **Session Timeout**: Configurable expiration

### Data Protection
- 🛡️ **Row Level Security (RLS)**: Enforced on all 45+ database tables
- 🔐 **Data Encryption**: At rest (database) and in transit (TLS 1.3)
- 🎭 **Role-Based Access Control (RBAC)**: 6-tier permission system
- 🔒 **Encrypted Storage**: OAuth tokens encrypted in database
- 🗝️ **Service Role Key**: Isolated admin access
- 📊 **Audit Logging**: Database changes tracked

### API Security
- 🔑 **API Key Protection**: Required for sensitive endpoints
- 🔒 **CORS Configuration**: Restricted origins
- 🚫 **Rate Limiting**: Prevents abuse (via Vercel)
- ✅ **Input Validation**: Zod schemas for all inputs
- 🛡️ **SQL Injection Protection**: Parameterized queries
- 🔐 **XSS Protection**: Content Security Policy headers
- 📝 **Request Logging**: All API calls logged

### Payment Security
- 💳 **PCI Compliance**: Stripe handles card data (PCI DSS Level 1)
- 🔒 **Webhook Verification**: Stripe signature validation
- 🔐 **HTTPS Only**: All payment traffic encrypted
- 💰 **No Card Storage**: Tokens used instead of card numbers
- 🔔 **Fraud Detection**: Stripe Radar enabled
- 📊 **Transaction Logging**: Complete audit trail

### Infrastructure Security
- 🌐 **HTTPS Enforced**: 301 redirects from HTTP
- 🔐 **TLS 1.3**: Modern encryption protocol
- 🛡️ **Security Headers**: HSTS, X-Frame-Options, CSP
- 🔒 **Environment Variables**: Never committed to git
- 🔑 **Secret Rotation**: Regular key updates recommended
- 📦 **Dependency Scanning**: npm audit regularly
- 🐛 **Error Handling**: No sensitive data in error messages

### Best Practices
- ❌ **Never Commit**: 
  - API keys or secrets
  - Database passwords
  - OAuth client secrets
  - Private keys
  - User data
  - `.env` files

- ✅ **Always Use**:
  - Environment variables for secrets
  - HTTPS for all connections
  - Parameterized database queries
  - Input validation on all forms
  - Principle of least privilege

### Security Monitoring
- 🔍 **Regular Audits**: Quarterly security reviews
- 📊 **Log Monitoring**: Vercel and Supabase logs
- 🚨 **Error Tracking**: Runtime errors logged
- 🔔 **Alert System**: Critical security notifications
- 📈 **Metrics**: Failed auth attempts tracked

### Vulnerability Reporting
- 📧 **Security Contact**: security@freedomaviationco.com (to be set up)
- 🔒 **Responsible Disclosure**: 90-day disclosure policy
- 🎁 **Bug Bounty**: Under consideration

### Compliance
- ✅ **GDPR Considerations**: Data minimization, user privacy
- ✅ **CCPA Compliance**: California privacy rights
- ✅ **SOC 2 via Vendors**: Supabase, Vercel, Stripe are SOC 2 compliant
- 📋 **Terms of Service**: In development
- 🔒 **Privacy Policy**: In development

## Troubleshooting

### Authentication Issues

**Can't log in / Session not persisting**
- Clear browser cache and localStorage
- Check Supabase URL configuration
- Verify redirect URLs in Supabase Dashboard
- See [Auth Production Guide](docs/development/auth/SUPABASE_AUTH_PRODUCTION_GUIDE.md)

**403 Errors on logout**
- Clear localStorage: `localStorage.clear()`
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### Access Control Issues

**Can't access admin/staff dashboard**
- Verify user has proper role in `user_profiles` table:
  ```sql
  SELECT email, role FROM user_profiles WHERE email = 'your@email.com';
  ```
- Promote user to admin:
  ```sql
  UPDATE user_profiles SET role = 'admin' WHERE email = 'your@email.com';
  ```

### Database Issues

**Connection errors**
- Check Supabase URL and keys are correct
- Verify Supabase project is active
- Check RLS policies aren't blocking access
- Review [Troubleshooting Guide](docs/development/troubleshooting.md)

**Migration failures**
- Check `migrations/README.md` for migration order
- Verify no dependent views need updating
- Review migration logs in Supabase Dashboard

### Build Issues

**TypeScript errors**
```bash
# Clear and reinstall
rm -rf node_modules dist
npm install
npm run check
```

**Vite build fails**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

### Production Issues

**API routes return 500**
- Check Vercel function logs
- Verify environment variables are set (without VITE_ prefix)
- Check Supabase service role key is valid

**Stripe webhooks not working**
- Verify webhook secret matches Stripe dashboard
- Check webhook endpoint is accessible
- Review Vercel function logs

For detailed troubleshooting, see:
- [Troubleshooting Guide](docs/development/troubleshooting.md)
- [Auth Guide](docs/development/auth/SUPABASE_AUTH_PRODUCTION_GUIDE.md)
- [Deployment Guide](docs/development/deployment.md)

## Performance

### Lighthouse Scores (90+ across all metrics)
- ⚡ **Performance**: 90-95 (Fast page loads, optimized assets)
- ♿ **Accessibility**: 95-100 (WCAG 2.1 AA compliant)
- ✅ **Best Practices**: 95-100 (HTTPS, secure headers, modern APIs)
- 🔍 **SEO**: 95-100 (Meta tags, structured data, sitemap)

### Optimization Techniques
- 📦 **Code Splitting**: Route-based lazy loading reduces initial bundle
- 🖼️ **Image Optimization**: Lazy loading, responsive images, modern formats
- 💾 **Caching Strategy**: 
  - TanStack Query for API responses
  - Service worker for offline support
  - Stale-while-revalidate pattern
- ⚡ **Vite HMR**: Sub-second hot module replacement in development
- 🎯 **Tree Shaking**: Dead code elimination in production builds
- 🗜️ **Compression**: Gzip/Brotli via Vercel Edge Network
- 🚀 **CDN**: Global edge network for static assets
- 📊 **Bundle Analysis**: Optimized chunk sizes
- ⚙️ **React 18**: Concurrent features for smoother UX

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1

### Performance Monitoring
- Vercel Analytics for real-time metrics
- Lighthouse CI for continuous monitoring
- Custom performance tracking in production

## Browser Support

### Desktop Browsers
- ✅ **Chrome/Edge** 90+ (Chromium-based, full support)
- ✅ **Firefox** 88+ (Full support)
- ✅ **Safari** 14+ (macOS, full support)
- ⚠️ **Internet Explorer**: Not supported (use modern browsers)

### Mobile Browsers
- ✅ **iOS Safari** 14+ (iPhone, iPad)
- ✅ **Chrome Mobile** (Android, iOS)
- ✅ **Samsung Internet** (Android)
- ✅ **Firefox Mobile** (Android, iOS)

### Progressive Web App (PWA)
- 📱 **Installable on**:
  - iOS devices (Add to Home Screen)
  - Android devices (Install App prompt)
  - Desktop (Chrome, Edge)
- 🔄 **Offline Capability**: Service worker for basic offline support
- 📲 **Standalone Mode**: Runs like a native app
- 🎨 **Native-like UI**: Full-screen, custom splash screen

### Native iOS App
- 🍎 **iOS**: 14.0+ required
- 📱 **Devices**: iPhone, iPad
- 💾 **Size**: ~15-20 MB (web assets bundled)
- 🔗 **Deep Linking**: Supports custom URL schemes
- 📦 **Distribution**: Internal testing (TestFlight ready)

### Technology Requirements
- **JavaScript**: Must be enabled
- **Cookies**: Required for authentication
- **Local Storage**: Used for session and caching
- **WebSockets**: Optional (for real-time features)

### Responsive Breakpoints
- 📱 **Mobile**: 320px - 640px (sm)
- 📱 **Tablet**: 641px - 1024px (md)
- 💻 **Desktop**: 1025px - 1536px (lg)
- 🖥️ **Large Desktop**: 1537px+ (xl, 2xl)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support & Contact

### Business Information
- **Company**: Freedom Aviation
- **Website**: [freedomaviationco.com](https://freedomaviationco.com)
- **Email**: info@freedomaviationco.com
- **Phone**: (970) 618-2094
- **Location**: 7565 S Peoria St, Englewood, CO 80112
- **Airport**: Centennial Airport (KAPA)

### Service Area
- **Primary**: Centennial Airport (KAPA), Denver Metro
- **Secondary**: Colorado Springs, Boulder, Fort Collins
- **Coverage**: 50-mile radius from KAPA
- **Region**: Colorado Front Range

### Getting Help

**For Technical Issues:**
1. Check [Troubleshooting Guide](docs/development/troubleshooting.md)
2. Search existing [GitHub Issues](https://github.com/your-repo/issues) (if applicable)
3. Review relevant [documentation](docs/)
4. Contact development team

**For Business Inquiries:**
- Email: info@freedomaviationco.com
- Phone: (970) 618-2094
- Contact form: [freedomaviationco.com/contact](https://freedomaviationco.com/contact)

**For Service Requests:**
- Log in to your dashboard
- Submit via Service Requests page
- Email notifications to operations team
- 24-hour response time (business days)

### Hours of Operation
- **Office Hours**: Monday-Friday, 8 AM - 5 PM MST
- **Support**: 24/7 for urgent aircraft issues
- **Response Time**: Within 24 hours for inquiries

### Connect With Us
- 🌐 Website: [freedomaviationco.com](https://freedomaviationco.com)
- 📧 Email: info@freedomaviationco.com
- 📞 Phone: (970) 618-2094
- 📍 Google Maps: [7565 S Peoria St, Englewood, CO 80112](https://maps.google.com/?q=7565+S+Peoria+St,+Englewood,+CO+80112)

### For Developers
- 📖 Full documentation: [docs/](docs/)
- 🐛 Report bugs: Through GitHub Issues or email
- 💡 Feature requests: Contact development team
- 🤝 Contributing: See [CONTRIBUTING.md](CONTRIBUTING.md)

## Acknowledgments

### Core Technologies
- Built with ❤️ using [React](https://react.dev) and [TypeScript](https://www.typescriptlang.org/)
- Backend powered by [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage)
- Deployed on [Vercel](https://vercel.com) Edge Network
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons by [Lucide](https://lucide.dev)
- Build system by [Vite](https://vitejs.dev)
- Payments by [Stripe](https://stripe.com)
- Email by [Resend](https://resend.com)
- Google integrations via [Google APIs](https://developers.google.com/)
- Testing with [Vitest](https://vitest.dev) and [Testing Library](https://testing-library.com)
- Native mobile with [Capacitor](https://capacitorjs.com)

### Special Thanks
- The open-source community for amazing tools and libraries
- Supabase team for excellent documentation and support
- Vercel for seamless deployment experience
- shadcn for the beautiful component library
- All contributors and testers

### Development Tools
- [VS Code](https://code.visualstudio.com/) - Primary IDE
- [Cursor](https://cursor.sh/) - AI-powered development
- [Replit](https://replit.com/) - Cloud development environment
- [GitHub](https://github.com/) - Version control and collaboration
- [Xcode](https://developer.apple.com/xcode/) - iOS app development

### Aviation Community
- Built for pilots, by pilots ✈️
- Serving the Colorado aviation community
- Based at Centennial Airport (KAPA), Englewood, CO

---

**Made with ✈️ by Freedom Aviation**

*Building the future of aircraft management, one flight at a time.*
