#!/bin/bash

# Fix environment variable file location
echo "🔧 Fixing environment configuration..."

# Copy env.local to .env.local if .env.local doesn't have proper config
if [ -f "env.local" ] && [ ! -s ".env.local" ]; then
    echo "📋 Copying env.local to .env.local..."
    cp env.local .env.local
    chmod 600 .env.local
    echo "✓ Copied configuration to .env.local"
else
    echo "ℹ️ .env.local already exists"
fi

echo ""
echo "⚠️  IMPORTANT: Your SUPABASE_SERVICE_ROLE_KEY appears to be incorrect!"
echo "   It's currently set to the same value as SUPABASE_ANON_KEY."
echo ""
echo "   To fix this:"
echo "   1. Go to your Supabase dashboard: https://supabase.com/dashboard"
echo "   2. Select your project"
echo "   3. Go to Settings > API"
echo "   4. Copy the 'service_role' key (NOT the 'anon' key)"
echo "   5. Update SUPABASE_SERVICE_ROLE_KEY in .env.local with the correct value"
echo ""
echo "   The service_role key should start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo "   and be different from your anon key"
echo ""
echo "✓ Fix script complete. Restart your dev server after updating the service_role key."


