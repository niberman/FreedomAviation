# Final Migration Plan ✅

## Status

The migration system has been consolidated and cleaned up. A master migration file has been created to align the Preview branch with the Production schema.

---

## 📂 Migration Files

The following migrations are now the source of truth in `supabase/migrations/`:

| Filename | Purpose | Status |
|----------|---------|--------|
| `20251121170000_preview_onboarding_setup.sql` | Create `onboarding_data` table | ✅ Applied |
| `20251121170001_complete_onboarding_setup.sql` | Backup setup | ✅ Applied |
| `20251121180000_fix_invoices_staff_access.sql` | Staff invoice access | ✅ Applied |
| `20251121190000_align_schema.sql` | **Master Alignment** | ⏳ **PENDING** |

---

## 🚀 Pending Action: Apply Alignment Migration

The file `supabase/migrations/20251121190000_align_schema.sql` performs the following critical actions:

1.  **Standardize User Table:** Renames `profiles` to `user_profiles` (if needed) to match production.
2.  **Cleanup Aircraft:** Removes duplicate `hobbs_time`/`tach_time` columns.
3.  **Resolve User Roles:** Consolidates user roles into `user_profiles.role` and drops the legacy `user_roles` table.
4.  **Fix Invoice Access:** Re-applies RLS policies using the new `user_profiles.role` schema.

### How to Apply

Since shell execution is restricted, apply this manually via Supabase Dashboard:

1.  **Go to Supabase Dashboard (Preview):** https://supabase.com/dashboard/project/frarfaidvppulsemvogd/sql/new
2.  **Open File:** `supabase/migrations/20251121190000_align_schema.sql`
3.  **Copy Content:** Copy the entire SQL content.
4.  **Run:** Paste into SQL Editor and click **Run**.

**Expected Result:**
- `user_profiles` table will be the standard.
- `user_roles` table will be deleted.
- `aircraft` table will be cleaned.
- Invoice access will continue to work for staff.

---

## 🧹 Cleanup Performed

Legacy migration files have been removed from the root `migrations/` directory to prevent confusion. All valid migrations are now in `supabase/migrations/` with proper timestamps.

---

## 🔍 Verification

After applying the migration:

```sql
-- Verify user_profiles
SELECT * FROM user_profiles LIMIT 1;

-- Verify roles
SELECT DISTINCT role FROM user_profiles;

-- Verify invoices RLS
SELECT policyname FROM pg_policies WHERE tablename = 'invoices';
```

## Next Steps for Production

Once verified on Preview:

1.  Merge `preview` branch to `main`.
2.  Run `supabase db push` against Production to apply the same alignment migration.

