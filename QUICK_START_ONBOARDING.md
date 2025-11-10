# Quick Start - Onboarding System

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (30 seconds)

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Step 2: Configure Environment (2 minutes)

Add to `.env.local`:

```bash
# Stripe Test Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_YOUR_KEY_HERE
EMAIL_SERVICE=resend
EMAIL_FROM="Freedom Aviation <onboarding@resend.dev>"
```

### Step 3: Run Database Migration (1 minute)

In Supabase SQL Editor, run:

```sql
-- Copy and paste contents of scripts/add-onboarding-table.sql
```

### Step 4: Start Development Server (10 seconds)

```bash
npm run dev
```

### Step 5: Test the Flow (2 minutes)

1. Go to http://localhost:5173/login
2. Click "Don't have an account? Register"
3. Create account with test email
4. Complete onboarding steps
5. Use Stripe test card: **4242 4242 4242 4242**
6. See dashboard!

---

## 🎯 What You Get

✅ **6-step onboarding wizard**
- Welcome → Personal Info → Aircraft → Membership → Payment → Complete

✅ **Stripe subscription integration**
- Monthly recurring billing
- Secure payment collection
- Customer management

✅ **Supabase data persistence**
- Progress tracking
- User profiles
- Aircraft records

✅ **Welcome email via Resend**
- Professional HTML template
- Branded design

---

## 🧪 Quick Test Checklist

- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Database migration run
- [ ] Dev server running
- [ ] Can access /login
- [ ] Can register new account
- [ ] Redirects to /onboarding
- [ ] Can fill personal info
- [ ] Can add aircraft
- [ ] Can select membership
- [ ] Can enter payment (test card)
- [ ] See welcome screen
- [ ] Redirect to dashboard
- [ ] Receive welcome email

---

## 📚 Need More Help?

- **Detailed Setup**: See `ONBOARDING_SETUP.md`
- **Complete Documentation**: See `ONBOARDING_COMPLETE.md`
- **Run Setup Script**: `./scripts/setup-onboarding.sh`

---

## 🔑 Important Test Data

**Stripe Test Cards**
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

**Test Aircraft**
- Tail: N12345
- Make: Cirrus
- Model: SR22T

**Expiry/CVC/ZIP**
- Any future date (12/34)
- Any 3 digits (123)
- Any 5 digits (80112)

---

That's it! You're ready to test the complete onboarding flow. 🎉

