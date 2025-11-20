-- Create helper function to execute SQL from Node.js scripts
-- This enables AI to directly execute SQL migrations without human intervention

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
