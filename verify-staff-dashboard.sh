#!/bin/bash

echo "🔍 Staff Dashboard Configuration Verification"
echo "=============================================="
echo ""

# Check environment files
echo "📁 Checking environment files..."
if [ -f ".env.local" ]; then
    echo "✓ .env.local exists"
    
    # Check for required variables
    if grep -q "SUPABASE_URL" .env.local; then
        echo "✓ SUPABASE_URL is set"
    else
        echo "✗ SUPABASE_URL is missing"
    fi
    
    if grep -q "SUPABASE_ANON_KEY" .env.local; then
        echo "✓ SUPABASE_ANON_KEY is set"
    else
        echo "✗ SUPABASE_ANON_KEY is missing"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "✓ SUPABASE_SERVICE_ROLE_KEY is set"
        
        # Check if service role key is different from anon key
        ANON_KEY=$(grep "SUPABASE_ANON_KEY" .env.local | cut -d= -f2 | head -1)
        SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d= -f2)
        
        if [ "$ANON_KEY" = "$SERVICE_KEY" ]; then
            echo "  ⚠️  WARNING: SERVICE_ROLE_KEY appears to be the same as ANON_KEY"
            echo "     This is incorrect and will cause 503 errors!"
        else
            echo "  ✓ SERVICE_ROLE_KEY is different from ANON_KEY (correct)"
        fi
    else
        echo "✗ SUPABASE_SERVICE_ROLE_KEY is missing"
    fi
else
    echo "✗ .env.local does not exist"
    if [ -f "env.local" ]; then
        echo "  ℹ️  Found env.local - run ./fix-env.sh to copy it to .env.local"
    fi
fi

echo ""

# Check favicon files
echo "🖼️  Checking favicon files..."
if [ -f "public/favicon.png" ]; then
    echo "✓ public/favicon.png exists"
else
    echo "✗ public/favicon.png is missing"
fi

if [ -f "public/apple-touch-icon.png" ]; then
    echo "✓ public/apple-touch-icon.png exists"
else
    echo "✗ public/apple-touch-icon.png is missing"
fi

if [ -f "client/public/favicon.png" ]; then
    echo "✓ client/public/favicon.png exists"
else
    echo "✗ client/public/favicon.png is missing"
fi

echo ""

# Check critical files
echo "📋 Checking critical files..."
if [ -f "server/routes.ts" ]; then
    echo "✓ server/routes.ts exists"
    
    # Check if the enhanced endpoint is present
    if grep -q "console.log(\"📋 /api/service-requests - Request received\")" server/routes.ts; then
        echo "  ✓ Enhanced error logging is present"
    else
        echo "  ⚠️  Enhanced error logging may not be present"
    fi
else
    echo "✗ server/routes.ts is missing"
fi

if [ -f "client/src/pages/staff-dashboard.tsx" ]; then
    echo "✓ client/src/pages/staff-dashboard.tsx exists"
else
    echo "✗ client/src/pages/staff-dashboard.tsx is missing"
fi

echo ""

# Summary
echo "📊 Summary"
echo "----------"
echo ""

if [ -f ".env.local" ] && grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
    ANON_KEY=$(grep "SUPABASE_ANON_KEY" .env.local | cut -d= -f2 | head -1)
    SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d= -f2)
    
    if [ "$ANON_KEY" = "$SERVICE_KEY" ]; then
        echo "❌ ACTION REQUIRED: Update your SUPABASE_SERVICE_ROLE_KEY"
        echo ""
        echo "   1. Go to https://supabase.com/dashboard"
        echo "   2. Select your project"
        echo "   3. Go to Settings > API"
        echo "   4. Copy the 'service_role' key"
        echo "   5. Update .env.local with the correct key"
        echo "   6. Restart your dev server"
        echo ""
    else
        echo "✅ Configuration looks good!"
        echo ""
        echo "   To test:"
        echo "   1. Start your dev server: npm run dev"
        echo "   2. Log in as admin/staff"
        echo "   3. Navigate to /staff"
        echo "   4. Check for service requests loading properly"
        echo ""
    fi
else
    echo "❌ Configuration incomplete. Please check the errors above."
    echo ""
fi

echo "For detailed fix instructions, see: STAFF_DASHBOARD_PERMANENT_FIX.md"

