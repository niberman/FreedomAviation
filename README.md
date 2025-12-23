# Freedom Aviation

Premium aircraft management and flight instruction at Centennial Airport (KAPA), Colorado.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **State Management**: TanStack Query
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payment features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/freedom-aviation.git
cd freedom-aviation
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Fill in your environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related pages (login, register, etc.)
│   ├── (dashboard)/       # Owner dashboard pages
│   ├── (marketing)/       # Marketing pages
│   ├── (staff)/           # Staff/admin pages
│   ├── api/               # API routes
│   └── ...
├── components/            # React components
│   ├── pages/            # Page-level components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
└── ...
shared/                    # Shared types and schemas
public/                    # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run check` - Run TypeScript type checking

## Key Features

- **Owner Portal**: Aircraft management, service requests, invoices
- **Staff Dashboard**: Client management, operations, scheduling
- **Pricing Calculator**: Interactive quote generation
- **Authentication**: Supabase Auth with Google OAuth
- **Payments**: Stripe integration for invoice payments
- **PWA Support**: Progressive Web App capabilities

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Application URL |

## Deployment

The application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy

## License

MIT License - See [LICENSE](LICENSE) for details.
