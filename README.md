# Freedom Aviation

> Premium aircraft management platform for owners, flight instructors, and administrators.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Freedom Aviation is a comprehensive web application for managing aircraft, memberships, maintenance, and flight instruction services. Built with modern technologies and designed for aircraft owners, CFIs, and service coordinators.

## Features

### For Aircraft Owners
- 📊 **Dashboard** - Real-time aircraft status and metrics
- ✈️ **Aircraft Management** - Track multiple aircraft with detailed information
- 🔧 **Maintenance Tracking** - Monitor upcoming maintenance and inspections
- 📝 **Service Requests** - Submit and track service requests
- 💳 **Membership Billing** - Transparent pricing with Stripe integration
- 📱 **Mobile Responsive** - Access from any device

### For Flight Instructors (CFIs)
- 📅 **Schedule Management** - Create and manage availability
- 🗓️ **Google Calendar Sync** - Automatic two-way calendar integration
- 👥 **Client Management** - Track student progress and bookings
- 📊 **Staff Dashboard** - Overview of operations and schedule

### For Administrators
- 🎯 **Admin Dashboard** - Kanban-style workflow management
- 👤 **User Management** - Manage owners, CFIs, and staff
- ⚙️ **Pricing Configuration** - Configure service packages and tiers
- 📈 **Analytics** - Track operations and revenue
- 🔐 **Role-Based Access** - Secure role management (Owner, CFI, Admin)

### Technical Features
- 🔒 **Secure Authentication** - Supabase Auth with OAuth support (Google)
- 🛡️ **Row Level Security** - Database-level access control
- 🎨 **Modern UI** - Tailwind CSS with shadcn/ui components
- ⚡ **Fast Performance** - Vite build system with optimized loading
- 📱 **PWA Ready** - Progressive Web App capabilities
- 🔍 **SEO Optimized** - Local SEO for Colorado market

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

### Quick Start
- **[Getting Started Guide](docs/development/getting-started.md)** - Development environment setup
- **[Deployment Guide](docs/development/deployment.md)** - Production deployment
- **[Troubleshooting](docs/development/troubleshooting.md)** - Common issues and solutions

### Architecture & Database
- **[Database Schema](docs/architecture/database-schema.md)** - Complete database reference
- **[Schema Reference](docs/architecture/schema-reference.md)** - Detailed schema documentation
- **[Database Migrations](migrations/)** - Migration scripts and guide

### Features
- **[Google Integration](docs/features/google-integration.md)** - OAuth and Calendar sync
- **[SEO Strategy](docs/features/seo-strategy.md)** - Search engine optimization
- **[Pricing System](docs/features/pricing.md)** - Pricing tiers and calculator

### Design & Development
- **[Design Guidelines](docs/design/guidelines.md)** - Design system and UI principles
- **[Contributing Guide](CONTRIBUTING.md)** - Development workflow
- **[Utility Scripts](scripts/)** - Database and deployment scripts

### AI Assistant Reference
- **[Cursor Context](CURSOR_CONTEXT.md)** - Complete context for AI coding assistants

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
npm run dev       # Start development server with hot reload
npm run build     # Build for production
npm start         # Start production server
npm run check     # Type check TypeScript
```

## Environment Variables

Required variables in `.env.local`:

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
```

See `env.local.example` for complete list.

## Routes

### Public Routes
- `/` - Homepage
- `/pricing` - Pricing packages
- `/hangar-locations` - Hangar locations map
- `/contact` - Contact form
- `/about` - About page
- `/login` - Sign in / Sign up

### Protected Routes (Requires Auth)
- `/dashboard` - Owner dashboard
- `/dashboard/more` - Settings and billing

### Staff Routes (Requires CFI or Admin role)
- `/staff` - Staff dashboard
- `/admin` - Admin kanban board
- `/admin/pricing` - Pricing configurator

## Deployment

### Branches & Environments

- **`main`** → Production ([freedomaviationco.com](https://freedomaviationco.com))
- **`preview`** → Preview environment
- **`feature/*`** → Feature branches (auto-preview)

### Deploying to Production

1. Merge to `main` branch
2. Vercel automatically deploys
3. Set environment variables in Vercel Dashboard
4. Configure custom domain in Vercel

### Environment Variables in Vercel

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all required variables for Production
3. Redeploy if needed

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- All database tables have Row Level Security (RLS)
- OAuth tokens are encrypted
- Regular security audits recommended

## Troubleshooting

### Can't access admin dashboard?
- Verify user has `admin` or `cfi` role in `user_profiles` table
- Run `scripts/check-setup.sql` to diagnose issues
- Promote user: `UPDATE user_profiles SET role = 'admin' WHERE email = 'your@email.com'`

### Database connection errors?
- Check Supabase URL and keys are correct
- Verify Supabase project is active
- Ensure RLS policies are properly configured

### Build errors?
```bash
rm -rf node_modules dist
npm install
npm run build
```

See [Getting Started Guide](docs/development/getting-started.md) for more troubleshooting.

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
