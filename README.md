# Freedom Aviation

> Premium aircraft management platform for owners, flight instructors, and administrators.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Freedom Aviation is a comprehensive web application for managing aircraft, memberships, maintenance, and flight instruction services. Built with modern technologies and designed for aircraft owners, CFIs, and service coordinators.

## Features

### ✈️ For Aircraft Owners

**Dashboard & Management**
- 📊 Real-time aircraft status and metrics
- 🛩️ Multi-aircraft tracking with detailed profiles
- 📸 Aircraft images and documentation
- ⏱️ Hobbs and Tach hour tracking
- ⛽ Fuel capacity monitoring (usable and tabs)
- 📱 Fully responsive mobile interface

**Maintenance & Service**
- 🔧 Automated maintenance tracking (calendar, hobbs, and tach-based)
- 🚨 Maintenance status alerts (current, due soon, overdue)
- 📝 Service request submission with priority levels
- ✈️ Pre-flight concierge scheduling
- 🔔 Email notifications for service updates
- 📋 Complete service history

**Billing & Payments**
- 💳 Stripe-powered invoice payment
- 📄 Invoice history and tracking
- 💰 Transparent pricing with online calculator
- 🎫 Membership credit management
- 📧 Automated billing notifications

### 👨‍✈️ For Flight Instructors (CFIs)

- 📅 Schedule management dashboard
- 🗓️ Google Calendar two-way sync
- 👥 Student/client tracking
- 📊 Instruction request handling
- 💵 Invoice creation for flight instruction
- ✉️ Automated email notifications
- 🎯 Staff-level access to operations

### 🎯 For Administrators & Staff

**Operations Management**
- 📋 Kanban board for service request workflow
- 🏃 Drag-and-drop task management
- 👥 Client and aircraft oversight
- 📈 Operations dashboard
- 🔍 Advanced filtering and search

**Configuration & Setup**
- ⚙️ Unified pricing configurator
- 💰 Multi-tier pricing management (Class I, II, III)
- 📍 Location-based hangar pricing
- 👤 User role management
- 🎛️ System settings and configuration

**Reporting & Analytics**
- 📊 Service metrics
- 💵 Revenue tracking
- ⏰ Hour band analysis
- 📈 Margin calculations

### 🔐 Technical Features

**Security & Authentication**
- 🔒 Supabase Auth with email/password
- 🌐 Google OAuth integration
- 🔑 JWT-based authentication
- 🛡️ Row Level Security (RLS) on all tables
- 🎭 Six-tier role system (owner, cfi, staff, ops, admin, founder)
- 🍪 Secure cookie management

**Performance & Reliability**
- ⚡ Vite build system for fast HMR
- 📦 Code splitting and lazy loading
- 💾 TanStack Query for efficient data fetching
- 🔄 Automatic session refresh
- ⚡ Lighthouse score 90+ across metrics
- 📱 Progressive Web App (PWA) ready

**iOS Native App (via Capacitor)**
- 📱 Native iOS app with web technologies
- 🍎 App Store ready
- 📸 Camera and photo library access
- 🔔 Push notifications support
- 🔐 OAuth redirects via custom URL scheme
- 🎨 Native splash screen and icons

**Developer Experience**
- 📘 TypeScript throughout
- 🎨 Tailwind CSS + shadcn/ui components
- 🧪 Vitest + Testing Library
- 🔍 Type-safe database queries
- 📝 Comprehensive documentation
- 🔧 Hot module replacement

**SEO & Marketing**
- 🔍 Optimized for Colorado market
- 🌐 Structured data (JSON-LD)
- 🗺️ Sitemap generation
- 📱 Mobile-first responsive design
- 🚀 Fast page loads
- 📊 Analytics ready

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

For complete documentation, see the **[docs/](docs/)** directory.

### 🚀 Quick Start
- **[Getting Started Guide](docs/development/getting-started.md)** - Development environment setup
- **[Deployment Guide](docs/development/deployment.md)** - Production deployment
- **[Troubleshooting](docs/development/troubleshooting.md)** - Common issues and solutions
- **[iOS Setup Guide](docs/IOS_SETUP.md)** - 📱 Build and deploy the iOS app

### 🏗️ Architecture & Database
- **[Database Schema](docs/architecture/database-schema.md)** - Complete database reference
- **[Schema Reference](docs/architecture/schema-reference.md)** - Detailed schema documentation
- **[Database Migrations](migrations/README.md)** - 19 migration scripts with guide

### 🔐 Authentication & Security
- **[Supabase Auth Production Guide](docs/development/auth/SUPABASE_AUTH_PRODUCTION_GUIDE.md)** - Complete auth setup
- **[Auth Deployment Guide](docs/development/auth/DEPLOY_AUTH_FIXES.md)** - Quick deployment steps
- **[Auth Fixes Summary](docs/development/auth/AUTH_FIXES_SUMMARY.md)** - Recent fixes overview

### ⚙️ Setup & Configuration
- **[Email Configuration](docs/setup/email-configuration.md)** - Resend email setup
- **[Stripe Configuration](docs/setup/stripe-configuration.md)** - Payment processing setup

### ✨ Features
- **[Google Integration](docs/features/google-integration.md)** - OAuth and Calendar sync
- **[SEO Strategy](docs/features/seo-strategy.md)** - Search engine optimization
- **[Pricing System](docs/features/pricing.md)** - Pricing tiers and calculator

### 🎨 Design & Development
- **[Design Guidelines](docs/design/guidelines.md)** - Design system and UI principles
- **[Contributing Guide](CONTRIBUTING.md)** - Development workflow and standards
- **[Utility Scripts](scripts/README.md)** - 21 database and deployment scripts

### 🤖 AI Assistant Reference
- **[Cursor Context](CURSOR_CONTEXT.md)** - Complete context for AI coding assistants
- Includes document organization policy and development guidelines

## Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Wouter** - Lightweight routing
- **TanStack Query** - Powerful data fetching
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library

### Backend
- **Express.js** - HTTP server
- **Supabase** - Database, auth, and storage
- **PostgreSQL** - Relational database with RLS
- **Stripe** - Payment processing
- **Google APIs** - OAuth and Calendar integration

### DevOps
- **Vercel** - Hosting and deployment
- **Git** - Version control
- **npm** - Package management

## Project Structure

```
FreedomAviation-1/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── pages/       # Page components (routes)
│   │   ├── components/  # Reusable UI components
│   │   ├── lib/         # Utilities and configurations
│   │   ├── hooks/       # Custom React hooks
│   │   ├── seo/         # SEO utilities
│   │   └── features/    # Feature modules
│   └── public/          # Static assets
├── server/              # Express.js backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   └── lib/             # Server utilities
├── shared/              # Shared TypeScript types
│   ├── schema.ts        # Database schema definitions
│   └── database-types.ts # Generated types
├── scripts/             # Database scripts
├── docs/                # Documentation
│   ├── setup/           # Setup guides
│   ├── features/        # Feature documentation
│   ├── architecture/    # System architecture
│   └── development/     # Development guides
└── public/              # Public static files
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload (port 5000)

# Building
npm run build        # Build for production (outputs to dist/)
npm run check        # Type check TypeScript without building

# Testing
npm run test         # Run test suite once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open Vitest UI
npm run test:coverage # Generate coverage report

# iOS (Capacitor)
npm run cap:sync     # Build web app and sync to all platforms
npm run cap:sync:ios # Build web app and sync to iOS
npm run cap:open:ios # Open iOS project in Xcode
npm run cap:run:ios  # Build, sync, and open iOS in Xcode
npm run cap:add:ios  # Add iOS platform (already done)

# Production
npm start            # Start production server
```

## Environment Variables

### Development (`.env.local`)

Required variables for local development:

```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google (Optional - for OAuth & Calendar)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google-calendar/callback
```

### Production (Vercel)

⚠️ **Important**: In Vercel serverless functions, `VITE_` prefixed variables are NOT available at runtime (only during build).

Set BOTH versions in Vercel:

```env
# For client-side (build time)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# For server-side (runtime - required for API routes)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_live_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

See `env.local.example` for complete list with descriptions.

## Routes

### Public Routes
- `/` - Homepage with hero, features, and testimonials
- `/pricing` - Pricing tiers and calculator
- `/hangars` - Hangar locations map (formerly `/hangar-locations`)
- `/contact` - Contact form
- `/about` - About page
- `/login` - Sign in / Sign up with Google OAuth
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset confirmation

### Protected Routes (Owner)
*Requires authentication*
- `/dashboard` - Owner dashboard with aircraft overview
- `/dashboard/aircraft` - Aircraft management
- `/dashboard/members` - Membership details and credits
- `/dashboard/settings` - Account settings and profile
- `/dashboard/more` - Additional settings and billing
- `/onboarding` - New user onboarding flow

### Staff/Admin Routes
*Requires staff, admin, or founder role*
- `/staff` or `/admin` - Staff home dashboard
- `/staff/manage` or `/admin/manage` - Kanban board for service requests
- `/staff/members` - Client management
- `/staff/aircraft` - Aircraft oversight
- `/staff/operations` - Operations dashboard
- `/staff/settings` - Staff settings
- `/staff/pricing` or `/admin/pricing` - Unified pricing configurator

### API Routes
- `/api/stripe/webhook` - Stripe payment webhooks
- `/api/stripe/create-checkout` - Create Stripe checkout session
- `/api/google-calendar/*` - Google Calendar OAuth and sync
- `/api/email-notifications/*` - Email notification processing

## Deployment

### Branches & Environments

- **`main`** → Production ([freedomaviationco.com](https://freedomaviationco.com))
- **`preview`** → Preview environment
- **`feature/*`** → Feature branches (auto-preview)

### Deploying to Production (Web)

1. Merge to `main` branch
2. Vercel automatically deploys
3. Set environment variables in Vercel Dashboard
4. Configure custom domain in Vercel

### Environment Variables in Vercel

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all required variables for Production
3. Redeploy if needed

### Deploying iOS App

The iOS app is built using Capacitor and can be deployed to the App Store:

1. **Build and sync**:
   ```bash
   npm run cap:sync:ios
   ```

2. **Open in Xcode**:
   ```bash
   npm run cap:open:ios
   ```

3. **Configure signing** in Xcode (Signing & Capabilities)

4. **Archive and upload** to App Store Connect

For detailed iOS deployment instructions, see **[iOS Setup Guide](docs/IOS_SETUP.md)**.

## Project Organization

### Documentation Structure

All documentation is organized in the `docs/` directory:

```
docs/
├── README.md                       # Documentation index
├── architecture/                   # System architecture
│   ├── database-schema.md
│   └── schema-reference.md
├── development/                    # Development guides
│   ├── auth/                       # Authentication docs
│   ├── getting-started.md
│   ├── deployment.md
│   ├── troubleshooting.md
│   └── database-migrations.md
├── features/                       # Feature documentation
│   ├── google-integration.md
│   ├── pricing.md
│   └── seo-strategy.md
├── setup/                          # Configuration guides
│   ├── email-configuration.md
│   └── stripe-configuration.md
└── design/                         # Design guidelines
    └── guidelines.md
```

**Root-level files are limited to**:
- `README.md` - This file
- `CONTRIBUTING.md` - Contribution guidelines
- `CURSOR_CONTEXT.md` - AI assistant reference
- `LICENSE` - License file

⚠️ **Do not create new documentation files in the project root!** Use the appropriate `docs/` subdirectory.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Documentation Guidelines

- Place new docs in appropriate `docs/` subdirectory
- Update `docs/README.md` with links to new documents
- Keep README.md and CURSOR_CONTEXT.md updated
- Follow existing naming conventions (kebab-case)

## Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- All database tables have Row Level Security (RLS)
- OAuth tokens are encrypted
- Regular security audits recommended

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

- ⚡ Lighthouse score: 90+ across all metrics
- 📦 Optimized bundle size with code splitting
- 🚀 Fast page loads with Vite HMR
- 💾 Efficient caching with TanStack Query
- 📱 Mobile-first responsive design

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support & Contact

- **Website**: [freedomaviationco.com](https://freedomaviationco.com)
- **Email**: info@freedomaviationco.com
- **Phone**: (970) 618-2094
- **Location**: 7565 S Peoria St, Englewood, CO 80112 (Centennial Airport - KAPA)

## Acknowledgments

- Built with [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons by [Lucide](https://lucide.dev)
- Styled with [Tailwind CSS](https://tailwindcss.com)

---

**Made with ✈️ by Freedom Aviation**
