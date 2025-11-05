# Stripe Setup - Shell Commands Quick Reference

## Quick Start

```bash
# Run automated setup script
./scripts/setup-stripe.sh
```

## Install Stripe CLI

### macOS
```bash
brew install stripe/stripe-cli/stripe
```

### Linux
```bash
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

## Stripe CLI Commands

```bash
# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/stripe/webhook

# Check version
stripe --version

# List webhooks
stripe webhooks list

# Trigger test event
stripe trigger checkout.session.completed
```

## Environment Variables

### Export for current session
```bash
export STRIPE_SECRET_KEY="sk_test_..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
export STRIPE_WEBHOOK_SECRET="whsec_..."
export SUPABASE_URL="https://xxxxx.supabase.co"
```

### Create .env file
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

### Verify variables
```bash
echo $STRIPE_SECRET_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
echo $STRIPE_WEBHOOK_SECRET
```

## Database Setup

```bash
# View migration SQL
cat scripts/add-stripe-fields.sql

# Run with psql (if you have direct DB access)
psql $DATABASE_URL -f scripts/add-stripe-fields.sql
```

## Testing

### Start dev server
```bash
npm run dev
```

### Start webhook forwarding (in separate terminal)
```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

### Test webhook endpoint
```bash
curl -X POST http://localhost:5000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variables
vercel env add STRIPE_SECRET_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add SUPABASE_URL

# List variables
vercel env ls

# Deploy
vercel --prod
```

## Complete Local Setup Flow

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login
stripe login

# 3. Set environment variables
export STRIPE_SECRET_KEY="sk_test_..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
export SUPABASE_URL="https://xxxxx.supabase.co"

# 4. Start webhook forwarding (in separate terminal)
stripe listen --forward-to localhost:5000/api/stripe/webhook
# Copy the whsec_... secret from output

# 5. Set webhook secret
export STRIPE_WEBHOOK_SECRET="whsec_..."

# 6. Start dev server
npm run dev

# 7. Test with card: 4242 4242 4242 4242
```

