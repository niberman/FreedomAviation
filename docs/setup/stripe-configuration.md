# Stripe Payment Configuration

## Overview

Freedom Aviation uses Stripe for payment processing, subscription management, and billing.

## Setup Steps

### 1. Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or log in
3. Complete business verification (for production)

### 2. Get API Keys

**Test Mode** (for development):
- Dashboard → Developers → API keys
- Copy **Publishable key** and **Secret key**

**Live Mode** (for production):
- Enable live mode in dashboard
- Complete business verification
- Copy live keys

### 3. Configure Environment Variables

Add to your `.env.local` or deployment environment:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...           # Secret key (server-side)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Publishable key (client-side)
```

**Security Note**: Never commit secret keys to version control!

### 4. Create Products and Prices

In Stripe Dashboard:

1. **Products** → Create product
2. For each pricing class (I, II, III):
   - Name: "Class I Membership", "Class II Membership", etc.
   - Pricing: Recurring, monthly
   - Set price ($399, $599, $999)
   - Copy Price ID (e.g., `price_1ABC...`)

### 5. Configure Webhooks

Webhooks notify your app about Stripe events (payments, cancellations, etc.).

1. Dashboard → Developers → Webhooks
2. Add endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. Copy webhook signing secret (starts with `whsec_`)

### 6. Add Webhook Secret to Environment

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Integration Points

### Checkout Flow

1. User selects pricing tier on `/pricing` page
2. Creates Stripe Checkout session via `/api/stripe/create-checkout-session`
3. Redirects to Stripe hosted checkout
4. On success, webhook creates/updates subscription in database
5. User redirected to dashboard

### Subscription Management

Users can manage subscriptions via:
- `/dashboard/more` - View current plan and billing
- Stripe Customer Portal - Cancel, update payment method

### Customer Portal

Enable in Stripe Dashboard:
- Settings → Billing → Customer portal
- Allow customers to:
  - Update payment methods
  - Cancel subscriptions
  - View invoices

Generate portal link via:
```javascript
const session = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: 'https://yourdomain.com/dashboard/more',
});
```

## Testing

### Test Cards

Use these card numbers in test mode:

| Card Number         | Scenario              |
|--------------------|-----------------------|
| 4242 4242 4242 4242 | Success              |
| 4000 0000 0000 9995 | Declined             |
| 4000 0025 0000 3155 | Requires auth (3D Secure) |

Use any:
- Future expiry date
- Any 3-digit CVC
- Any ZIP code

### Testing Webhooks Locally

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

Trigger test events:
```bash
stripe trigger checkout.session.completed
```

## Production Checklist

Before going live:

- [ ] Switch to live API keys
- [ ] Verify business information in Stripe
- [ ] Enable live mode webhooks
- [ ] Test full payment flow with real card
- [ ] Configure payout schedule
- [ ] Set up email receipts
- [ ] Review refund policy
- [ ] Enable fraud prevention (Radar)
- [ ] Set up tax collection (if applicable)
- [ ] Test subscription cancellation flow
- [ ] Verify webhook endpoint is secure (HTTPS)
- [ ] Monitor initial transactions closely

## Price IDs

Store Price IDs in your application configuration:

```typescript
const STRIPE_PRICES = {
  classI: 'price_1ABC...',    // $399/month
  classII: 'price_1DEF...',   // $599/month
  classIII: 'price_1GHI...',  // $999/month
};
```

## Webhook Handling

Example webhook handler:

```typescript
app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'checkout.session.completed':
        // Create membership in database
        break;
      case 'customer.subscription.updated':
        // Update membership status
        break;
      case 'customer.subscription.deleted':
        // Cancel membership
        break;
    }
    
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

## Troubleshooting

**"Invalid API Key"**
- Verify key is correct and not expired
- Ensure you're using test key in development
- Check environment variables are loaded

**Webhook not receiving events**
- Verify endpoint URL is accessible
- Check webhook signing secret is correct
- Ensure endpoint returns 200 status
- Review webhook logs in Stripe Dashboard

**Payment declined**
- Normal for test cards in certain scenarios
- In production, customer should contact their bank
- Enable Stripe Radar for fraud prevention

**Subscription not created**
- Check webhook logs for errors
- Verify database connection
- Ensure RLS policies allow insertion
- Check server logs for errors

## Monitoring

### Stripe Dashboard

Monitor these sections regularly:
- **Payments** - Successful and failed transactions
- **Customers** - Active subscribers
- **Subscriptions** - Active, past due, canceled
- **Disputes** - Chargebacks and disputes
- **Logs** - API request logs
- **Webhooks** - Delivery attempts

### Analytics

Track these metrics:
- Monthly Recurring Revenue (MRR)
- Churn rate
- Average Revenue Per User (ARPU)
- Payment success rate
- Time to first payment

## Security Best Practices

1. **Never log or store full card numbers**
2. **Use Stripe Elements** for PCI compliance
3. **Validate webhook signatures** always
4. **Use HTTPS** in production
5. **Rotate API keys** periodically
6. **Enable Radar** for fraud prevention
7. **Implement idempotency keys** for safe retries
8. **Set up alerts** for unusual activity

## Key Files

- `server/routes.ts` - Stripe API endpoints
- `client/src/pages/Pricing.tsx` - Pricing display and checkout
- `client/src/pages/dashboard/More.tsx` - Billing management
- `.env.local` - API keys (local dev)
- Deployment platform environment variables (production)

## Support

For issues:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Stripe API Status: https://status.stripe.com

## Additional Resources

- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Subscription Lifecycle](https://stripe.com/docs/billing/subscriptions/overview)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)

