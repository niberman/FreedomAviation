# Onboarding System Setup

This document outlines the complete onboarding system that connects registration, pricing, and operations through Stripe, Supabase, and Resend.

## Overview

The onboarding system provides a smooth multi-step process for new users:

1. **Welcome** - Introduction to the onboarding process
2. **Personal Information** - Collect user contact details
3. **Aircraft Information** - Gather aircraft details and flying habits
4. **Membership Selection** - Choose service tier and hours band
5. **Payment Setup** - Configure Stripe subscription
6. **Complete** - Welcome email and redirect to dashboard

## Required Dependencies

### Install Stripe React Libraries

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Environment Variables

Add the following to your `.env.local` file:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_SERVICE=resend
EMAIL_FROM="Freedom Aviation <onboarding@resend.dev>"

# Supabase (should already be configured)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

## Database Setup

Run the SQL migration to create the onboarding tracking table:

```bash
# In Supabase SQL Editor, run:
psql -f scripts/add-onboarding-table.sql
```

Or manually execute the SQL in `scripts/add-onboarding-table.sql` in your Supabase SQL Editor.

This creates:
- `onboarding_data` table to track user progress
- `stripe_customer_id` and `stripe_subscription_id` fields in `user_profiles`
- Appropriate RLS policies

## Features

### Multi-Step Onboarding Flow

#### Step 1: Welcome
- Introduction to the process
- Overview of what to expect
- Estimated time to complete

#### Step 2: Personal Information
- Full name (required)
- Phone number (required)
- Address, city, state, ZIP (optional)
- Form validation with error messages
- Updates `user_profiles` table

#### Step 3: Aircraft Information
- Tail number (required, validated as N-number)
- Make and model (required)
- Year, base location (optional)
- Hobbs/Tach hours (optional)
- Average monthly flying hours (for recommendations)
- Primary use (personal, business, training, etc.)
- Creates aircraft record in database

#### Step 4: Membership Selection
- Displays pricing packages (Class I, II, III)
- Shows recommended package based on aircraft
- Hour band selection (0-10, 10-25, 25-40, 40+)
- Real-time price calculation
- Displays included features

#### Step 5: Payment Setup
- Stripe Elements integration
- Subscription creation (not one-time payment)
- Secure payment processing
- Order summary with pricing breakdown
- PCI-compliant payment collection

#### Step 6: Complete
- Success confirmation
- Welcome email sent via Resend
- Auto-redirect to dashboard after 5 seconds
- Manual redirect button available

### Intelligent Recommendations

The system recommends packages based on aircraft type:
- **Class I** (Basic Piston): C172, C182, Archer, Cherokee
- **Class II** (High-Performance): SR20, SR22, SR22T, DA40, Mooney
- **Class III** (Turbine): Vision Jet, TBM, light jets

Hour bands are recommended based on average monthly flying hours.

### Progress Tracking

- Visual progress bar shows completion percentage
- Step counter displays current step (e.g., "Step 3 of 6")
- Data saved automatically after each step
- Users can return and continue where they left off
- Progress stored in `onboarding_data` table

### Integration Points

#### Supabase
- User authentication and profile management
- Aircraft record creation
- Onboarding progress tracking
- RLS policies ensure data security

#### Stripe
- Customer creation (or retrieval if exists)
- Subscription setup with monthly recurring payments
- Payment method collection via Elements
- Metadata tracking (user_id, package_id, hours_band)
- Webhook support for payment events

#### Resend
- Welcome email sent on completion
- Professional HTML template
- Brand-consistent design
- Dashboard access link included

## API Endpoints

### POST /api/onboarding/create-subscription
Creates a Stripe subscription for the user's selected membership.

**Request:**
```json
{
  "userId": "uuid",
  "membershipSelection": {
    "package_id": "class-ii",
    "hours_band": "10-25"
  },
  "personalInfo": {
    "full_name": "John Doe",
    "phone": "(970) 555-0123"
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "subscriptionId": "sub_xxx",
  "customerId": "cus_xxx"
}
```

### GET /api/onboarding/stripe-info
Retrieves Stripe customer and subscription IDs for authenticated user.

**Headers:**
```
Authorization: Bearer <supabase_access_token>
```

**Response:**
```json
{
  "customerId": "cus_xxx",
  "subscriptionId": "sub_xxx"
}
```

### POST /api/onboarding/welcome-email
Sends welcome email to newly onboarded user.

**Request:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

## Registration Flow Update

The registration flow now redirects to onboarding instead of requiring email confirmation first:

1. User fills out registration form (`/login?register=true`)
2. Account created in Supabase Auth
3. User profile created via trigger
4. Redirect to `/onboarding` after 1 second
5. User completes onboarding steps
6. Membership activated and welcome email sent
7. Redirect to `/dashboard`

## Pricing Configuration

Pricing is configured in `client/src/lib/pricing-packages.ts`:

```typescript
const PACKAGES = [
  {
    id: "class-i",
    title: "Class I — Basic Piston",
    baseMonthly: 200,
    hours: [
      { range: "0-10", priceMultiplier: 1.0 },
      { range: "10-25", priceMultiplier: 1.45 },
      { range: "25-40", priceMultiplier: 1.9 },
      { range: "40+", priceMultiplier: 2.2 },
    ],
  },
  // ... Class II and III
];
```

Monthly price = `baseMonthly * priceMultiplier`

## Testing

### Test the Complete Flow

1. Navigate to `/login` and click "Register"
2. Create a new account with test email
3. Should redirect to `/onboarding` automatically
4. Complete all steps with test data
5. Use Stripe test card: `4242 4242 4242 4242`
6. Verify welcome email is sent (check console or email)
7. Should redirect to `/dashboard`

### Test Stripe Payment

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Authentication**: `4000 0025 0000 3155`

Use any future expiry date, any CVC, and any ZIP code.

### Test Email Delivery

Set up Resend:
1. Sign up at https://resend.com
2. Get API key from dashboard
3. Add to environment variables
4. Set `EMAIL_SERVICE=resend`
5. Use test domain or verify custom domain

## Troubleshooting

### Onboarding Data Not Saving
- Check browser console for errors
- Verify RLS policies allow user to insert/update own data
- Ensure `onboarding_data` table exists

### Stripe Payment Failing
- Verify Stripe publishable key is set in `VITE_STRIPE_PUBLISHABLE_KEY`
- Check Stripe dashboard for error logs
- Ensure secret key has proper permissions
- Verify webhook endpoint is configured (for production)

### Email Not Sending
- Check `EMAIL_SERVICE` is set to "resend"
- Verify `RESEND_API_KEY` is correct
- In console mode, emails are logged (not sent)
- Check Resend dashboard for delivery status

### Aircraft Not Created
- Check RLS policy allows authenticated users to insert aircraft
- Verify `owner_id` matches `auth.uid()`
- Check for duplicate tail numbers

## Security Considerations

- All routes use RLS policies to ensure users can only access their own data
- Payment processing uses Stripe Elements (PCI compliant)
- Stripe customer and subscription IDs stored securely in database
- API endpoints verify user authentication before proceeding
- Onboarding progress is user-scoped

## Future Enhancements

Potential improvements:
- Add promo code support during payment step
- Implement annual billing option with discount
- Add aircraft photos upload
- Enable pause/cancel subscription from dashboard
- Add onboarding analytics tracking
- Implement A/B testing for conversion optimization
- Add live chat support during onboarding
- Enable multiple aircraft during onboarding

