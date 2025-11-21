#!/bin/bash

# Pull complete schema from Supabase database
# This script uses pg_dump to extract the schema

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Pulling schema from Supabase...${NC}"

# Load environment variables
if [ -f "env.local" ]; then
  export $(cat env.local | grep -v '^#' | xargs)
else
  echo -e "${RED}Error: env.local file not found${NC}"
  exit 1
fi

# Extract database details from Supabase URL
# Format: https://PROJECT_ID.supabase.co
PROJECT_ID=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Error: Could not extract project ID from SUPABASE_URL${NC}"
  exit 1
fi

echo -e "${GREEN}Project ID: ${PROJECT_ID}${NC}"
echo ""
echo "To pull the schema, you need your database password."
echo "You can find it in your Supabase dashboard:"
echo "  1. Go to https://app.supabase.com/project/${PROJECT_ID}/settings/database"
echo "  2. Look for 'Database password' or 'Connection string'"
echo ""
echo "Then run one of these commands:"
echo ""
echo -e "${BLUE}Option 1: Using Supabase CLI (recommended):${NC}"
echo "  npx supabase login"
echo "  npx supabase link --project-ref ${PROJECT_ID}"
echo "  npx supabase db pull --schema public"
echo ""
echo -e "${BLUE}Option 2: Using pg_dump directly:${NC}"
echo "  pg_dump -h db.${PROJECT_ID}.supabase.co -U postgres -d postgres \\"
echo "    --schema=public --schema-only --no-owner --no-acl \\"
echo "    -f supabase-schema-backup.sql"
echo ""
echo -e "${BLUE}Option 3: Using psql to generate schema:${NC}"
echo "  psql -h db.${PROJECT_ID}.supabase.co -U postgres -d postgres \\"
echo "    -c \"\\d+ *\" > schema-info.txt"
echo ""


