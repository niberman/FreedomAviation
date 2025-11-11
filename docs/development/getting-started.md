# Development Guide

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account and project
- Git

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FreedomAviation-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `env.local.example` to `.env.local`
   - Fill in required variables (see Configuration section)

4. **Set up Supabase database**
   - Run `supabase-schema.sql` in Supabase SQL Editor
   - Create an admin user with `scripts/setup-admin.sql`
   - Verify with `scripts/check-setup.sql`

5. **Start development server**
   ```bash
   npm run dev
   ```
   
   Opens at http://localhost:5000

## Configuration

### Required Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://wsepwuxkwjnsgmkddkjw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:password@db.wsepwuxkwjnsgmkddkjw.supabase.co:5432/postgres

# Optional: Stripe (for payment testing)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: Google OAuth & Calendar
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google-calendar/callback
```

### Getting Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - `URL` → `VITE_SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Project Structure

```
/Users/noah/FreedomAviation/FreedomAviation-1/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable UI components
│   │   ├── lib/         # Utilities and configurations
│   │   ├── hooks/       # Custom React hooks
│   │   ├── seo/         # SEO utilities
│   │   └── features/    # Feature-specific modules
│   └── public/          # Static assets
├── server/              # Express.js backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   └── lib/             # Server utilities
├── shared/              # Shared TypeScript types
│   ├── schema.ts        # Database schema types
│   └── database-types.ts # Generated database types
├── scripts/             # Database scripts and utilities
├── docs/                # Documentation
└── public/              # Public static files
```

## Available Scripts

### Development
```bash
npm run dev          # Start dev server with hot reload
npm run check        # Type check TypeScript
npm run test         # Run tests (if configured)
```

### Production
```bash
npm run build        # Build for production
npm start            # Start production server
```

### Database
```bash
# Run in Supabase SQL Editor
scripts/setup-admin.sql          # Create admin user
scripts/check-setup.sql          # Verify database setup
scripts/add-google-calendar-integration.sql  # Add calendar tables
```

## Development Workflow

### Creating a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop locally**
   - Make changes
   - Test thoroughly
   - Check types: `npm run check`

3. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Making Database Changes

1. **Update `supabase-schema.sql`** with new tables/columns
2. **Create migration script** in `scripts/` directory
3. **Test migration** in development Supabase project
4. **Update `shared/schema.ts`** with new types
5. **Document changes** in `docs/architecture/database-schema.md`

### Adding New Routes

1. **Backend**: Add route in `server/routes.ts`
2. **Frontend**: Add page component in `client/src/pages/`
3. **Routing**: Update route logic in `client/src/App.tsx`
4. **Auth**: Add to `ProtectedRoute` if authentication required

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Lucide React** - Icons

### Backend
- **Express.js** - HTTP server
- **TypeScript** - Type safety
- **Supabase** - Database and auth
- **Stripe** - Payment processing
- **Google APIs** - OAuth and Calendar

### Database
- **PostgreSQL** (via Supabase)
- **Row Level Security** for access control
- **Database triggers** for automation

## Debugging

### Frontend Debugging

**Browser DevTools:**
- React DevTools extension
- Network tab for API calls
- Console for errors

**Common Issues:**
- Check Supabase URL and keys
- Verify user authentication state
- Check RLS policies if data not loading

### Backend Debugging

**Server Logs:**
```bash
# Logs appear in terminal where you ran npm run dev
```

**Common Issues:**
- Port 5000 already in use: Kill process or change port
- Database connection errors: Check DATABASE_URL
- Stripe errors: Verify API keys

### Database Debugging

**Supabase Dashboard:**
- **SQL Editor** - Run queries directly
- **Table Editor** - View/edit data
- **Auth** - Manage users
- **Logs** - View database logs

**Common Issues:**
- RLS blocking queries: Check policies
- Foreign key violations: Verify related records exist
- Trigger not firing: Check trigger definition

## Testing

### Manual Testing Checklist

- [ ] Sign up new user
- [ ] Log in with email/password
- [ ] Log in with Google OAuth
- [ ] View dashboard as owner
- [ ] Access admin dashboard (requires admin role)
- [ ] Create service request
- [ ] View pricing page
- [ ] Test responsive design on mobile

### Test User Roles

Create test users with different roles:
- **Owner**: Regular authenticated user
- **CFI**: Flight instructor access
- **Admin**: Full system access

```sql
-- Promote test user to admin
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'test@example.com';
```

## Code Style

### TypeScript
- Use TypeScript for all new code
- Define interfaces for component props
- Use type inference where obvious
- Avoid `any` type

### React
- Functional components with hooks
- Use TanStack Query for data fetching
- Keep components small and focused
- Extract reusable logic to custom hooks

### Styling
- Use Tailwind utility classes
- Follow existing design patterns
- Use shadcn/ui components when possible
- Ensure mobile responsiveness

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Files**: kebab-case (e.g., `user-profile.ts`)
- **Functions**: camelCase (e.g., `getUserProfile()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

## Deployment

### Branches
- `main` - Production (freedomaviationco.com)
- `preview` - Preview environment
- `feature/*` - Feature branches

### Vercel Deployment

Automatically deploys on push to:
- `main` → Production
- Other branches → Preview deployments

**Environment Variables:**
Set in Vercel Dashboard → Project Settings → Environment Variables

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Type checking clean (`npm run check`)
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Stripe webhooks updated (if applicable)
- [ ] Test in preview environment first

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
npm run build
```

### Port 5000 in use
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9

# Or change port in vite.config.ts
```

### Supabase connection issues
- Verify URL and keys are correct
- Check Supabase project is active
- Ensure RLS policies allow access

### Build errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Getting Help

### Resources
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

### Internal Documentation
- `docs/architecture/database-schema.md` - Database reference
- `docs/setup/stripe-configuration.md` - Payment setup
- `docs/features/google-integration.md` - OAuth & Calendar
- `docs/features/seo-strategy.md` - SEO implementation

### Common Commands Quick Reference

```bash
# Start development
npm run dev

# Type check
npm run check

# Build for production
npm run build

# View build output
npm start

# Install new dependency
npm install package-name

# Update dependencies
npm update
```

## Best Practices

1. **Security**
   - Never commit secrets to Git
   - Use environment variables
   - Validate user input
   - Implement proper RLS policies

2. **Performance**
   - Lazy load routes and components
   - Optimize images
   - Use React Query caching
   - Minimize bundle size

3. **Accessibility**
   - Use semantic HTML
   - Include ARIA labels
   - Test with keyboard navigation
   - Ensure color contrast

4. **Code Quality**
   - Write self-documenting code
   - Add comments for complex logic
   - Keep functions small
   - Follow DRY principle

---

Happy coding! 🚀

