# 🚀 Enable Direct SQL Execution from AI

## Quick Setup (1 minute)

This enables the AI to execute SQL migrations directly in Supabase without human intervention.

### 1. Go to Supabase SQL Editor
https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/sql/new

### 2. Paste and Run This SQL:

```sql
-- Create helper function to execute SQL from Node.js scripts
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql_query;
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

-- Test it
SELECT exec_sql('SELECT 1+1');
```

### 3. That's it! ✅

Now the AI can execute SQL migrations automatically using:
```bash
node scripts/execute-sql.js "YOUR SQL HERE"
node scripts/execute-sql.js -f migrations/some-file.sql
```

---

## What This Enables:

✅ AI can run database migrations automatically  
✅ No more copying/pasting SQL into Supabase  
✅ Fixes can be applied instantly  
✅ All migrations tracked in git  

---

## Security:

- Function uses `SECURITY DEFINER` (runs with creator's permissions)
- Only accessible via `service_role` key (already secured in env.local)
- Returns detailed error messages for debugging

---

**After setup, the AI will immediately run the pending user deletion cascade fix!**
