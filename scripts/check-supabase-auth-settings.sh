#!/bin/bash
# Check Supabase auth settings via SQL

source env.local 2>/dev/null || true

PROJECT_REF="wsepwuxkwjnsgmkddkjw"
DB_HOST="${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="${SUPABASE_DB_PASSWORD}"

echo "🔍 Checking Supabase Auth Configuration..."
echo ""

# Try to query auth schema
PGPASSWORD="${DB_PASSWORD}" psql \
  "postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require" \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' ORDER BY table_name;" 2>&1 | head -20

echo ""
echo "📋 Redirect URLs Configuration:"
echo "================================"
echo ""
echo "⚠️  Redirect URLs CANNOT be modified via SQL!"
echo "They are part of Supabase project configuration."
echo ""
echo "🔧 Manual Action Required:"
echo "1. Go to: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration"
echo "2. Add these URLs to 'Redirect URLs':"
echo ""
echo "   https://www.freedomaviationco.com/reset-password"
echo "   https://freedomaviationco.com/reset-password" 
echo "   http://localhost:3000/reset-password"
echo "   http://localhost:3001/reset-password"
echo "   http://localhost:5173/reset-password"
echo ""
echo "3. Click 'Save' at the bottom"
echo ""
echo "✅ After adding these URLs, password reset will work immediately!"
