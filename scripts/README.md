# Scripts

Operational utilities. **Schema changes belong in `supabase/migrations/`**, not here.

## One-off database operations

These are not versioned migrations — run them manually in the Supabase SQL Editor when needed.

### Promote a user to admin

```sql
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

After running, the user must log out and back in for the role to take effect.

## Diagnostic / environment helpers

| Script | What it does |
| --- | --- |
| `check-production-rls.mjs` | Sanity-checks RLS policies against the production DB |
| `diagnose-founder-access.mjs` | Verifies a founder/admin account has full access |
| `verify-env-config.mjs` | Confirms required `.env.local` vars are set |
| `fetch-schema-api.mjs` / `pull-schema.mjs` / `pull-schema.sh` | Introspect the live schema |
| `execute-sql.js` / `run-sql-file.sh` | Ad-hoc SQL runners against the service-role endpoint |
| `connect-to-supabase.sh` | Links the CLI to the remote project |
| `setup-env.sh` / `set-env-vars.sh` | Bootstrap `.env.local` |
| `get-webhook-secret.sh` | Fetch the Stripe webhook signing secret |

Run any script from the repo root, e.g.:

```bash
node scripts/verify-env-config.mjs
```
