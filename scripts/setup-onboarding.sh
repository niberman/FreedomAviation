#!/bin/bash

# Setup script for Freedom Aviation Onboarding System
# This script installs necessary dependencies and guides through configuration

set -e

echo "🛩️  Freedom Aviation Onboarding System Setup"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Install Stripe dependencies
echo "📦 Step 1: Installing Stripe dependencies..."
npm install @stripe/stripe-js @stripe/react-stripe-js
echo "✅ Stripe dependencies installed"
echo ""

# Step 2: Check environment variables
echo "🔧 Step 2: Checking environment variables..."
echo ""

if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Creating from example..."
    if [ -f "env.local.example" ]; then
        cp env.local.example .env.local
        echo "✅ Created .env.local from example"
    else
        echo "❌ Error: env.local.example not found"
        exit 1
    fi
fi

# Check for required environment variables
echo "Checking required environment variables..."
missing_vars=()

if ! grep -q "VITE_STRIPE_PUBLISHABLE_KEY" .env.local; then
    missing_vars+=("VITE_STRIPE_PUBLISHABLE_KEY")
fi

if ! grep -q "STRIPE_SECRET_KEY" .env.local; then
    missing_vars+=("STRIPE_SECRET_KEY")
fi

if ! grep -q "RESEND_API_KEY" .env.local; then
    missing_vars+=("RESEND_API_KEY")
fi

if ! grep -q "EMAIL_SERVICE" .env.local; then
    echo "EMAIL_SERVICE=console" >> .env.local
    echo "Added EMAIL_SERVICE=console (emails will be logged)"
fi

if ! grep -q "EMAIL_FROM" .env.local; then
    echo 'EMAIL_FROM="Freedom Aviation <onboarding@resend.dev>"' >> .env.local
    echo "Added EMAIL_FROM with Resend test domain"
fi

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Missing environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please add these to your .env.local file:"
    echo ""
    
    if [[ " ${missing_vars[@]} " =~ " VITE_STRIPE_PUBLISHABLE_KEY " ]] || [[ " ${missing_vars[@]} " =~ " STRIPE_SECRET_KEY " ]]; then
        echo "Stripe keys (get from https://dashboard.stripe.com/test/apikeys):"
        echo "  STRIPE_SECRET_KEY=sk_test_xxxxx"
        echo "  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx"
        echo ""
    fi
    
    if [[ " ${missing_vars[@]} " =~ " RESEND_API_KEY " ]]; then
        echo "Resend API key (get from https://resend.com/api-keys):"
        echo "  RESEND_API_KEY=re_xxxxx"
        echo ""
    fi
else
    echo "✅ All required environment variables found"
fi

echo ""

# Step 3: Database setup
echo "💾 Step 3: Database setup"
echo ""
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "File: scripts/add-onboarding-table.sql"
echo ""
echo "This creates:"
echo "  - onboarding_data table"
echo "  - Stripe customer/subscription fields in user_profiles"
echo "  - RLS policies for onboarding data"
echo ""
read -p "Have you run the SQL migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Please run scripts/add-onboarding-table.sql in Supabase SQL Editor"
    echo "   Then re-run this setup script"
    exit 1
fi

echo "✅ Database setup confirmed"
echo ""

# Step 4: Summary
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Verify your .env.local has all required variables"
echo "2. Get Stripe test keys from https://dashboard.stripe.com/test/apikeys"
echo "3. Get Resend API key from https://resend.com/api-keys"
echo "4. Test the onboarding flow:"
echo "   - Run: npm run dev"
echo "   - Navigate to /login"
echo "   - Create a new account"
echo "   - Complete the onboarding flow"
echo "   - Use Stripe test card: 4242 4242 4242 4242"
echo ""
echo "📚 Documentation: ONBOARDING_SETUP.md"
echo ""

