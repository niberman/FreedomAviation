#!/bin/bash
# Run a SQL file against Supabase PostgreSQL database
# Usage: ./scripts/run-sql-file.sh <path-to-sql-file>

if [ -z "$1" ]; then
    echo "❌ Error: No SQL file specified"
    echo "Usage: ./scripts/run-sql-file.sh <path-to-sql-file>"
    echo ""
    echo "Examples:"
    echo "  ./scripts/run-sql-file.sh migrations/create_membership_quotes_table.sql"
    echo "  ./scripts/run-sql-file.sh migrations/cleanup_aircraft_duplicate_columns.sql"
    exit 1
fi

SQL_FILE="$1"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: File not found: $SQL_FILE"
    exit 1
fi

# Extract project ref from environment
source env.local 2>/dev/null || source .env 2>/dev/null

PROJECT_REF="wsepwuxkwjnsgmkddkjw"
DB_HOST="${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "📄 Running SQL file: $SQL_FILE"
echo "🔌 Connecting to: $DB_HOST"
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

# Run the SQL file
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
  "postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require" \
  -f "$SQL_FILE"

echo ""
echo "✅ SQL file executed"

