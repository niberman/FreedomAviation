# Setup Guide

Quick setup instructions for Freedom Aviation. For comprehensive documentation, see the `docs/` directory.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp env.local.example .env.local
# Edit .env.local with your credentials
```

### 3. Set Up Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project
3. Run `supabase-schema.sql` in SQL Editor
4. Run `scripts/setup-admin.sql` to create admin user

### 4. Start Development Server
```bash
npm run dev
```

Open http://localhost:5000

## Environment Variables

Required in `.env.local`:

```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (Optional - for invoice emails)
EMAIL_SERVICE=resend
RESEND_API_KEY=re_...

# Google (Optional - for OAuth & Calendar)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

See `env.local.example` for complete list.

## Create Admin User

After first signup, promote your user to admin:

```sql
-- Run in Supabase SQL Editor
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'your@email.com';
```

Verify with:
```bash
scripts/check-setup.sql
```

## Comprehensive Documentation

For detailed setup and configuration:

- **[Getting Started](docs/development/getting-started.md)** - Complete development setup
- **[Database Schema](docs/architecture/database-schema.md)** - Database structure and RLS
- **[Stripe Configuration](docs/setup/stripe-configuration.md)** - Payment integration
- **[Email Configuration](docs/setup/email-configuration.md)** - Email services
- **[Google Integration](docs/features/google-integration.md)** - OAuth and Calendar
- **[SEO Strategy](docs/features/seo-strategy.md)** - Search optimization
- **[Contributing](CONTRIBUTING.md)** - How to contribute

## Troubleshooting

### Can't access admin dashboard?
```sql
-- Check your role
SELECT email, role FROM public.user_profiles WHERE email = 'your@email.com';

-- Promote to admin
UPDATE public.user_profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### Database connection errors?
- Verify Supabase URL and keys
- Check project is active
- Ensure RLS policies are configured

### Build errors?
```bash
rm -rf node_modules dist
npm install
npm run build
```

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm run check     # Type check TypeScript
```

## Support

- **Documentation**: See `docs/` directory
- **Email**: info@freedomaviationco.com
- **Website**: freedomaviationco.com

---

For complete setup instructions, see [Getting Started Guide](docs/development/getting-started.md).
