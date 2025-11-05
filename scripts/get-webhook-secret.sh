#!/bin/bash

# Quick script to get webhook signing secret from Stripe CLI
# Run this while your dev server is running

echo "🔐 Getting Stripe Webhook Signing Secret..."
echo ""
echo "This will start webhook forwarding and show you the signing secret."
echo "Press Ctrl+C after you copy the 'whsec_...' secret."
echo ""
echo "Starting webhook listener..."
echo ""

stripe listen --forward-to localhost:5000/api/stripe/webhook

