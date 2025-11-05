# Stripe Setup Checklist

Follow these steps in order to set up Stripe payments for your Freedom Aviation application.

## Step 1: Create/Login to Stripe Account

1. Go to https://dashboard.stripe.com/register (or login if you have an account)
2. Complete account setup if new
3. Switch to **Test Mode** (toggle in top right) for development

## Step 2: Get Your Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_test_...` for test mode)
   - This is your `STRIPE_SECRET_KEY`
3. Keep the page open - you'll need it later

## Step 3: Set Up Database (One-Time)

If you haven't already added Stripe fields to your invoices table:

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration script:
   ```sql
   -- Copy contents from scripts/add-stripe-fields.sql
   ```
   Or if your schema is fresh, `supabase-schema.sql` already includes these fields.

## Step 4: Configure Environment Variables

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables (click "Add" for each):

   | Variable Name | Value | Where to Get It |
   |--------------|-------|----------------|
   | `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe Dashboard → API Keys → Secret key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Supabase Dashboard → Settings → API → Service Role Key |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` | (See Step 5 - you'll get this after setting up webhook) |
   | `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API → Project URL |

4. Select environment: **Development**, **Preview**, and **Production** (check all three)
5. Click **Save**
6. **Redeploy** your application (Deployments → ... → Redeploy)

### For Replit Deployment:

1. Open your Replit project
2. Click the **Secrets** tab (🔒 icon in sidebar, or press `Ctrl+Shift+S`)
3. Add each variable (click "+" to add new):

   | Key | Value |
   |-----|-------|
   | `STRIPE_SECRET_KEY` | `sk_test_...` (from Stripe Dashboard) |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` (from Supabase Dashboard) |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` (see Step 5) |
   | `SUPABASE_URL` | `https://xxxxx.supabase.co` (from Supabase Dashboard) |

4. **Restart** your Replit (click Stop, then Run)

### Where to Get Supabase Service Role Key:

1. Go to Supabase Dashboard → Your Project
2. Click **Settings** (gear icon) → **API**
3. Find **Service Role Key** (⚠️ Keep this secret!)
4. Click **Reveal** and copy it

## Step 5: Set Up Stripe Webhook

### For Production (Vercel/Live Site):

1. Get your deployed URL (e.g., `https://yourdomain.com`)
2. Go to Stripe Dashboard → **Developers** → **Webhooks**
3. Click **"Add endpoint"**
4. Enter endpoint URL: `https://yourdomain.com/api/stripe/webhook`
5. Click **"Select events"** and choose:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
6. Click **"Add endpoint"**
7. Click on your new endpoint
8. Copy the **"Signing secret"** (starts with `whsec_...`)
9. Add this as `STRIPE_WEBHOOK_SECRET` in your environment variables (Step 4)
10. **Redeploy** your application

### For Local Development:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/stripe/webhook
   ```
4. Copy the **webhook signing secret** from the output (starts with `whsec_...`)
5. Add it as `STRIPE_WEBHOOK_SECRET` in your local `.env` file or environment

## Step 6: Verify Setup

1. **Check environment variables are set:**
   - Restart your server
   - Check server logs - you should NOT see warnings about missing Stripe keys

2. **Test the payment flow:**
   - Create a test invoice (as CFI in staff dashboard)
   - Finalize the invoice
   - Try to pay it (as owner)
   - Use test card: `4242 4242 4242 4242` (any future expiry, any CVC)

3. **Check webhook:**
   - Make a test payment
   - Check Stripe Dashboard → Developers → Webhooks → Your endpoint
   - Should see successful webhook deliveries

## Step 7: Go Live (When Ready)

1. **Switch Stripe to Live Mode:**
   - Stripe Dashboard → Toggle "Test mode" to "Live mode"
   - Get your **Live** secret key (starts with `sk_live_...`)
   - Update `STRIPE_SECRET_KEY` in your production environment

2. **Update webhook for production:**
   - Create a new webhook endpoint with your production URL
   - Update `STRIPE_WEBHOOK_SECRET` with the new signing secret

3. **Test with real card:**
   - Use a real card (will be charged!)
   - Verify payment appears in Stripe Dashboard

## Quick Reference: Required Environment Variables

| Variable | Example | Required For |
|----------|---------|--------------|
| `STRIPE_SECRET_KEY` | `sk_test_51...` | Creating checkout sessions |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Server-side database access |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Verifying webhook signatures |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase connection |

## Troubleshooting

**"Stripe or Supabase not configured" error:**
- Check all environment variables are set
- Restart your server after adding variables
- Verify variable names match exactly (case-sensitive)

**Webhook not working:**
- Check `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook URL in Stripe Dashboard matches your deployment URL
- Check server logs for webhook errors
- Ensure webhook endpoint is publicly accessible

**Payment button not showing:**
- Invoice must be status `finalized` (not `draft`)
- Invoice must have invoice_lines with amounts > 0
- User must be logged in and own the invoice

## Shell Commands Quick Reference

### Install Stripe CLI

**macOS (using Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

**Or use the automated setup script:**
```bash
./scripts/setup-stripe.sh
```

### Stripe CLI Commands

**Login to Stripe:**
```bash
stripe login
```

**Forward webhooks to local server:**
```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

**Check Stripe CLI version:**
```bash
stripe --version
```

**List your Stripe webhooks:**
```bash
stripe webhooks list
```

**Test webhook events (trigger a test event):**
```bash
stripe trigger checkout.session.completed
```

### Environment Variables Setup

**Export variables for current session (local development):**
```bash
export STRIPE_SECRET_KEY="sk_test_..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
export STRIPE_WEBHOOK_SECRET="whsec_..."
export SUPABASE_URL="https://xxxxx.supabase.co"
```

**Create .env file (if using dotenv):**
```bash
cat > .env << EOF
STRIPE_SECRET_KEY=sk_test_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
EOF
```

**Verify environment variables are set:**
```bash
echo $STRIPE_SECRET_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
echo $STRIPE_WEBHOOK_SECRET
```

### Database Setup

**Run Stripe fields migration in Supabase:**
```bash
# Copy the SQL file content and run in Supabase SQL Editor
cat scripts/add-stripe-fields.sql
```

**Or use psql (if you have direct database access):**
```bash
psql $DATABASE_URL -f scripts/add-stripe-fields.sql
```

### Testing Commands

**Start development server:**
```bash
npm run dev
```

**In another terminal, start webhook forwarding:**
```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

**Test webhook endpoint (requires running server):**
```bash
# Test with curl (should return 400 without proper signature, but confirms endpoint exists)
curl -X POST http://localhost:5000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Vercel CLI Commands

**Set environment variables in Vercel:**
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add STRIPE_SECRET_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add SUPABASE_URL

# List environment variables
vercel env ls

# Redeploy
vercel --prod
```

### Quick Setup Script

**Run the automated setup script:**
```bash
./scripts/setup-stripe.sh
```

This script will:
- Install Stripe CLI if needed
- Help you login to Stripe
- Check your environment variables
- Set up webhook forwarding

## Need More Details?

See `STRIPE_SETUP.md` for comprehensive documentation including API endpoints, payment flow diagrams, and advanced troubleshooting.

