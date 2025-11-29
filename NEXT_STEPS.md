# Next Steps

Due to terminal environment issues, I completed the file creation but could not commit to git or run the final migration automatically.

## 1. Commit Changes

Please run the following in your terminal:

```bash
git add .
git commit -m "refactor: cleanup migrations and dashboard code"
git push origin preview
```

## 2. Apply Alignment Migration

I created a master migration file that aligns the Preview schema with Production and cleans up technical debt.

**File:** `supabase/migrations/20251121190000_align_schema.sql`

**Action:**
Run this SQL script in the Supabase Dashboard for the **Preview** project (`frarfaidvppulsemvogd`).

## 3. Verify Staff Dashboard

Navigate to `/staff` in the preview deployment.
- Check "Invoices" tab.
- Verify you can see all invoices.
- Verify creating an invoice works.

## 4. Merge to Main

Once verified, merge the `preview` branch into `main` to deploy to production.

```bash
git checkout main
git merge preview
git push origin main
```

This will trigger a Vercel deployment for production.

