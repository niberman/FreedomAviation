#!/bin/bash

# Stripe Setup Script for Freedom Aviation
# This script helps you set up Stripe integration

set -e

echo "🚀 Freedom Aviation - Stripe Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
else
    echo -e "${RED}⚠️  Unsupported OS. Please install Stripe CLI manually.${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Install Stripe CLI
echo "📦 Step 1: Installing Stripe CLI..."
if command_exists stripe; then
    echo -e "${GREEN}✅ Stripe CLI is already installed${NC}"
    stripe --version
else
    echo "Installing Stripe CLI..."
    if [[ "$OS" == "macos" ]]; then
        if command_exists brew; then
            brew install stripe/stripe-cli/stripe
        else
            echo -e "${YELLOW}⚠️  Homebrew not found. Please install Stripe CLI manually:${NC}"
            echo "   Visit: https://stripe.com/docs/stripe-cli"
        fi
    elif [[ "$OS" == "linux" ]]; then
        echo "Installing Stripe CLI for Linux..."
        curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
        echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
        sudo apt update
        sudo apt install stripe
    fi
fi

echo ""

# Step 2: Login to Stripe
echo "🔐 Step 2: Logging in to Stripe..."
if command_exists stripe; then
    echo "Running: stripe login"
    echo -e "${YELLOW}This will open your browser to authenticate with Stripe${NC}"
    stripe login
else
    echo -e "${RED}❌ Stripe CLI not installed. Please install it first.${NC}"
    exit 1
fi

echo ""

# Step 3: Check environment variables
echo "🔍 Step 3: Checking environment variables..."
echo ""

ENV_VARS=("STRIPE_SECRET_KEY" "SUPABASE_SERVICE_ROLE_KEY" "STRIPE_WEBHOOK_SECRET" "SUPABASE_URL" "VITE_SUPABASE_URL")

MISSING_VARS=()

for var in "${ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ ${var} is not set${NC}"
        MISSING_VARS+=("$var")
    else
        # Mask sensitive values
        if [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"KEY"* ]]; then
            value="${!var}"
            masked="${value:0:10}...${value: -4}"
            echo -e "${GREEN}✅ ${var} is set${NC} (${masked})"
        else
            echo -e "${GREEN}✅ ${var} is set${NC}"
        fi
    fi
done

echo ""

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "To set them:"
    echo "   export ${MISSING_VARS[0]}=\"your_value_here\""
    echo ""
    echo "Or add them to your .env file or deployment platform secrets."
else
    echo -e "${GREEN}✅ All required environment variables are set!${NC}"
fi

echo ""

# Step 4: Forward webhooks (for local development)
echo "🌐 Step 4: Setting up webhook forwarding (for local development)..."
echo ""
echo "To forward Stripe webhooks to your local server, run:"
echo -e "${GREEN}stripe listen --forward-to localhost:5000/api/stripe/webhook${NC}"
echo ""
echo "This will:"
echo "  1. Forward webhooks from Stripe to your local server"
echo "  2. Display a webhook signing secret (whsec_...)"
echo "  3. Copy that secret and set it as STRIPE_WEBHOOK_SECRET"
echo ""
read -p "Do you want to start webhook forwarding now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting webhook forwarding..."
    echo -e "${YELLOW}⚠️  Keep this terminal open. Press Ctrl+C to stop.${NC}"
    echo ""
    stripe listen --forward-to localhost:5000/api/stripe/webhook
else
    echo "You can run this later with:"
    echo "  stripe listen --forward-to localhost:5000/api/stripe/webhook"
fi

echo ""
echo -e "${GREEN}✅ Stripe setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Set up webhook endpoint in Stripe Dashboard for production"
echo "  2. Test payment flow with test card: 4242 4242 4242 4242"
echo "  3. See STRIPE_SETUP_CHECKLIST.md for detailed instructions"

