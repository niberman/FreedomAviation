# Freedom Aviation

Premium aircraft management platform for owners, CFIs, and admins.

## Quick Start

### Prerequisites
- Node.js 20+
- Supabase account and project

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   - Review `env.local` (auto-generated from `env.local.example`)
   - Rename to `.env.local` if your tooling expects the dot-prefixed name
   - Fill in `SUPABASE_SERVICE_ROLE_KEY` (from Supabase → Project Settings → API)
   - Optionally set `STRIPE_SECRET_KEY` if testing billing flows

3. **Configure Supabase**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Open your project: `wsepwuxkwjnsgmkddkjw`
   - Run `supabase-schema.sql` in SQL Editor
   - Run `scripts/check-setup.sql` to verify setup

4. **Create Admin User**
   - Create a user in Supabase Dashboard → Authentication → Users
   - Run `scripts/setup-admin.sql` replacing email with your email
   - Or run:
     ```sql
     UPDATE public.user_profiles 
     SET role = 'admin'
     WHERE email = 'your-email@example.com';
     ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:5000 in your browser

## Deployment & Environments

- `main` branch → Vercel Production → `freedomaviationco.com`, `www.freedomaviationco.com`
- `dashboard` branch → Vercel Preview → `freedom-aviation.vercel.app`
- Configure Vercel Domains so `freedom-aviation.vercel.app` is pinned to the Preview environment and restricted to the `dashboard` branch.
- Ship risky dashboard iterations from `dashboard`; keep marketing updates on `main` to protect the public site.

## Important Notes

⚠️ **Can't access `/admin`?**
- You must be logged in as a user with `admin` or `cfi` role
- Check your role: run `scripts/check-setup.sql` in Supabase
- See [SETUP.md](SETUP.md) for detailed troubleshooting

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: Wouter
- **State**: TanStack Query
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Backend**: Express.js (for custom APIs)

## Project Structure

```
client/src/          # Frontend React application
  pages/             # Page components
  components/        # Reusable components
  lib/               # Utilities and configurations
  hooks/             # Custom React hooks

server/              # Express.js backend
  index.ts          # Server entry point
  routes.ts         # API routes
  vite.ts           # Vite middleware setup

shared/              # Shared TypeScript types
scripts/             # Setup and utility scripts
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check TypeScript

## Documentation

- [SETUP.md](SETUP.md) - Detailed setup and configuration guide
- [design_guidelines.md](design_guidelines.md) - Design system guidelines
- [STRIPE_SETUP.md](STRIPE_SETUP.md) - Stripe payment integration setup
- [EMAIL_SETUP.md](EMAIL_SETUP.md) - Email service configuration
- [PRODUCTION_STRIPE_CHECKLIST.md](PRODUCTION_STRIPE_CHECKLIST.md) - Production Stripe verification checklist

## Routes

### Public
- `/` - Homepage
- `/pricing` - Pricing packages
- `/hangar-locations` - Hangar locations
- `/contact` - Contact form

### Authenticated
- `/dashboard` - Owner overview
- `/dashboard/more` - Owner operations & billing
- `/dashboard/members` - Owner members workspace (preview)
- `/dashboard/aircraft` - Owner aircraft workspace (preview)
- `/dashboard/settings` - Owner settings workspace (preview)
- `/admin` - Admin dashboard (requires admin/CFI role)
- `/admin/pricing` - Pricing configurator
- `/staff` - Staff overview
- `/staff/members` - Staff member coordination (preview)
- `/staff/aircraft` - Staff aircraft operations (preview)
- `/staff/operations` - Staff workflow planning (preview)
- `/staff/settings` - Staff notification settings (preview)

## License

MIT

