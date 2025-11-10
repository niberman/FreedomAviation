# Staff Dashboard Setup Guide

This guide will help you fix all issues with the staff dashboard and ensure it's fully functional with Stripe, Resend, and proper database schema.

## Prerequisites

1. **Database Admin Access**: You need access to the Supabase SQL Editor
2. **Stripe Account**: For payment processing (see STRIPE_SETUP.md)
3. **Resend Account**: For email notifications (see EMAIL_SETUP.md)
4. **Environment Variables Access**: Ability to set environment variables in your deployment platform

## Step 1: Fix Database Schema

Run the following SQL script in your Supabase SQL Editor to fix all database issues:

```sql
-- Run: scripts/fix-staff-dashboard-database.sql
```

This script will:
- Add the missing `assigned_to` column to `service_requests`
- Add missing columns to `aircraft` table (make, model, class, hobbs_hours)
- Add Stripe fields to `invoices` table
- Create necessary indexes for performance
- Update RLS policies

## Step 2: Configure Environment Variables

### Required Variables for Full Functionality:

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |
| `RESEND_API_KEY` | Resend API key for emails | `re_...` |
| `EMAIL_SERVICE` | Email service to use | `resend` (or `console` for dev) |
| `EMAIL_FROM` | From email address | `Freedom Aviation <onboarding@resend.dev>` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJ...` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |

### Platform-Specific Setup:

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable above
3. Select all environments (Development, Preview, Production)
4. Redeploy application

**Replit:**
1. Open Secrets tab (🔒 icon)
2. Add each variable
3. Restart Replit

**Local Development:**
Create `.env.local` file:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
EMAIL_SERVICE=console
EMAIL_FROM=Freedom Aviation <onboarding@resend.dev>
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_URL=https://xxx.supabase.co
```

## Step 3: Test Email Service

1. **Console Mode (Development)**:
   ```env
   EMAIL_SERVICE=console
   ```
   Emails will be logged to console only.

2. **Resend Mode (Production)**:
   ```env
   EMAIL_SERVICE=resend
   RESEND_API_KEY=re_...
   EMAIL_FROM=Freedom Aviation <onboarding@resend.dev>
   ```

3. **Test Email Endpoint**:
   ```bash
   curl -X POST http://localhost:5000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"toEmail": "test@example.com"}'
   ```

## Step 4: Setup Stripe Webhooks

### Local Development:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:5000/api/stripe/webhook

# Copy the webhook secret and set as STRIPE_WEBHOOK_SECRET
```

### Production:
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://www.freedomaviationco.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy signing secret → Set as `STRIPE_WEBHOOK_SECRET`

## Step 5: Verify Dashboard Functionality

### Service Requests Flow:
1. **Owner Creates Request**:
   - Owner dashboard → "Prepare Aircraft" or "Request Service"
   - Creates entry in `service_requests` table

2. **Staff Views Requests**:
   - Staff dashboard → Service Requests tab
   - Kanban board shows pending/in-progress/completed requests

3. **Staff Updates Request**:
   - Click on request card
   - Edit dialog opens with full details
   - Can assign to staff, update status, add notes

### Invoice Flow:
1. **CFI Creates Invoice**:
   - Staff dashboard → Invoices tab
   - Fill in client, aircraft, hours, rate
   - Preview and send to client

2. **Email Sent**:
   - System sends email with invoice details
   - Includes Stripe payment link (if configured)

3. **Owner Pays**:
   - Owner receives email → Clicks payment link
   - Redirected to Stripe checkout
   - Payment updates invoice status

### Missing Features That Are Actually Implemented:

✅ **Service Request Assignment**: The `assigned_to` field works once database is updated
✅ **Email Notifications**: Working via Resend when configured
✅ **Stripe Payments**: Full checkout flow implemented
✅ **Staff/Owner Connection**: Service requests flow between dashboards
✅ **Invoice Management**: Complete create → send → pay flow

## Troubleshooting

### "column assigned_to does not exist" Error:
- Run the database fix script in Step 1
- Verify it completed successfully

### Emails Not Sending:
- Check `EMAIL_SERVICE` is set to `resend` (not `console`)
- Verify `RESEND_API_KEY` is valid
- Check `EMAIL_FROM` uses verified domain or test domain

### Stripe Payments Not Working:
- Verify `STRIPE_SECRET_KEY` is set
- Check webhook secret matches Stripe dashboard
- Ensure invoice status is "finalized"

### Service Requests Not Showing:
- Check RLS policies (fixed by database script)
- Verify user has staff/admin role
- Check browser console for specific errors

## Next Steps

1. **Production Checklist**:
   - Switch to live Stripe keys
   - Verify custom email domain in Resend
   - Test full payment flow with real card

2. **Optional Enhancements**:
   - Add SMS notifications (Twilio)
   - Implement recurring invoices
   - Add service request templates

3. **Monitoring**:
   - Check Stripe webhook logs regularly
   - Monitor Resend email delivery
   - Review error logs for failed operations

## Summary

The staff dashboard is fully functional once properly configured. All the features are already implemented in the code:
- ✅ Service request management with assignment
- ✅ Invoice creation and payment processing
- ✅ Email notifications
- ✅ Owner/staff dashboard integration

The only missing pieces are:
1. Database schema updates (run the SQL script)
2. Environment variables (Stripe, Resend keys)
3. Webhook configuration (for payment updates)

Once these are configured, the dashboard will be fully operational!
