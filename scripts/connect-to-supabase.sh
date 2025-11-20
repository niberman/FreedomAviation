#!/bin/bash
# Connect to Supabase PostgreSQL database
# Usage: ./scripts/connect-to-supabase.sh

# Load environment variables
source env.local 2>/dev/null || source .env 2>/dev/null

# Extract project ref from URL
PROJECT_REF="wsepwuxkwjnsgmkddkjw"
DB_HOST="${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "🔌 Connecting to Supabase PostgreSQL..."
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""
echo "⚠️  You'll need your Supabase database password."
echo "   Find it in: Supabase Dashboard → Settings → Database → Connection string"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed."
    echo "   Install it with: brew install postgresql"
    exit 1
fi

# Connect using psql
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
  "postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

