#!/bin/bash

# Apply onboarding_data RLS fix via Supabase API

# Load environment variables
if [ -f "env.local" ]; then
  export $(cat env.local | grep -v '^#' | xargs)
fi

# Read the SQL file
SQL_CONTENT=$(cat migrations/fix_onboarding_data_rls.sql)

# Execute via Supabase API
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"${SQL_CONTENT}\"}"

echo ""
echo "Migration applied!"

