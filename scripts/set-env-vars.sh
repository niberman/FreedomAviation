#!/bin/bash

# Helper script to set all Stripe/Supabase environment variables
# Usage: source scripts/set-env-vars.sh

echo "🔧 Setting up environment variables for Freedom Aviation"
echo ""

# Stripe Secret Key (already set)
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  STRIPE_SECRET_KEY not set. Set it with:"
    echo "   export STRIPE_SECRET_KEY='sk_test_...'"
else
    echo "✅ STRIPE_SECRET_KEY is set"
fi

# Prompt for Supabase URL if not set
if [ -z "$SUPABASE_URL" ]; then
    read -p "Enter Supabase URL (e.g., https://xxxxx.supabase.co): " SUPABASE_URL
    export SUPABASE_URL
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL not set"
else
    echo "✅ SUPABASE_URL: $SUPABASE_URL"
fi

# Prompt for Supabase Service Role Key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo ""
    echo "Enter Supabase Service Role Key (starts with eyJhbG...):"
    read -s SUPABASE_SERVICE_ROLE_KEY
    export SUPABASE_SERVICE_ROLE_KEY
    echo ""
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY not set"
else
    echo "✅ SUPABASE_SERVICE_ROLE_KEY is set (${#SUPABASE_SERVICE_ROLE_KEY} chars)"
fi

# Set NEXT_PUBLIC_SUPABASE_URL from SUPABASE_URL if not set (Next.js client)
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_URL" ]; then
    export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
    echo "✅ NEXT_PUBLIC_SUPABASE_URL set to: $NEXT_PUBLIC_SUPABASE_URL"
fi

# Prompt for NEXT_PUBLIC_SUPABASE_ANON_KEY
if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo ""
    echo "Enter Supabase Anon/Public Key (starts with eyJhbG...):"
    read -s NEXT_PUBLIC_SUPABASE_ANON_KEY
    export NEXT_PUBLIC_SUPABASE_ANON_KEY
    echo ""
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
else
    echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set (${#NEXT_PUBLIC_SUPABASE_ANON_KEY} chars)"
fi

# Prompt for Stripe Webhook Secret
if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo ""
    echo "Enter Stripe Webhook Secret (starts with whsec_...):"
    echo "   (Get this by running: stripe listen --forward-to localhost:5000/api/stripe/webhook)"
    read -s STRIPE_WEBHOOK_SECRET
    export STRIPE_WEBHOOK_SECRET
    echo ""
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "⚠️  STRIPE_WEBHOOK_SECRET not set (needed for webhook verification)"
else
    echo "✅ STRIPE_WEBHOOK_SECRET is set"
fi

echo ""
echo "📋 Summary:"
echo "   STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:+✅ SET}"
echo "   SUPABASE_URL: ${SUPABASE_URL:+✅ SET}"
echo "   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:+✅ SET}"
echo "   NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:+✅ SET}"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:+✅ SET}"
echo "   STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:+✅ SET}"
echo ""
echo "💡 To make these permanent, add them to your .env file or deployment platform secrets."
echo "💡 To use in current session, source this script: source scripts/set-env-vars.sh"

