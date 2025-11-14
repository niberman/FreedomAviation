# Table Usage Analysis - Freedom Aviation

Based on codebase analysis and your database schema.

## ✅ CORE TABLES (Heavily Used - DO NOT REMOVE)

| Table | Status | Evidence | Action |
|-------|--------|----------|--------|
| `user_profiles` | **CRITICAL** | Used everywhere for auth, roles | ✅ KEEP |
| `aircraft` | **CRITICAL** | Core business entity | ✅ KEEP |
| `service_requests` | **CRITICAL** | Core operations | ✅ KEEP |
| `service_tasks` | **CRITICAL** | Operations workflow | ✅ KEEP |
| `invoices` | **CRITICAL** | Billing system | ✅ KEEP |
| `invoice_lines` | **CRITICAL** | Billing details | ✅ KEEP |

## ✅ ACTIVE FEATURE TABLES (In Use - KEEP)

| Table | Status | Purpose | Action |
|-------|--------|---------|--------|
| `memberships` | **ACTIVE** | Membership management | ✅ KEEP |
| `consumable_events` | **ACTIVE** | Oil, O2, TKS tracking | ✅ KEEP |
| `cfi_schedule` | **ACTIVE** | CFI scheduling | ✅ KEEP |
| `instruction_requests` | **ACTIVE** | Flight instruction | ✅ KEEP |
| `google_calendar_tokens` | **ACTIVE** | Calendar integration | ✅ KEEP |
| `email_notifications` | **ACTIVE** | Email queue system | ✅ KEEP |
| `onboarding_data` | **ACTIVE** | User onboarding flow | ✅ KEEP |

## ⚠️ CONFIGURATION TABLES (Review Before Removing)

| Table | Status | Purpose | Action |
|-------|--------|---------|--------|
| `pricing_classes` | **CONFIG** | Pricing tiers | ⚠️ REVIEW |
| `pricing_locations` | **CONFIG** | Location pricing | ⚠️ REVIEW |
| `pricing_snapshots` | **CONFIG** | Historical pricing | ⚠️ REVIEW |
| `membership_tiers` | **CONFIG** | Membership config | ⚠️ REVIEW |
| `membership_quotes` | **CONFIG** | Quote generation | ⚠️ REVIEW |
| `aircraft_pricing_overrides` | **CONFIG** | Custom pricing | ⚠️ REVIEW |
| `settings_pricing_assumptions` | **CONFIG** | Pricing calculations | ⚠️ REVIEW |
| `client_billing_profiles` | **CONFIG** | Stripe integration | ⚠️ REVIEW |

## 🗑️ LIKELY UNUSED (Safe to Remove if Empty)

| Table | Status | Reason | Action |
|-------|--------|--------|--------|
| `user_roles` | **REDUNDANT** | Duplicates user_profiles.role | 🗑️ REMOVE |
| `settings` | **MINIMAL** | Generic settings, likely hardcoded | 🗑️ REMOVE if empty |
| `support_tickets` | **UNUSED** | Feature not implemented | 🗑️ REMOVE if empty |
| `pilot_currency` | **UNUSED** | Feature not active | 🗑️ REMOVE if empty |
| `payment_methods` | **REDUNDANT** | Duplicates client_billing_profiles | 🗑️ REMOVE if empty |
| `notifications` | **UNUSED** | In-app notifications not implemented | 🗑️ REMOVE if empty |
| `maintenance_due` | **MAYBE** | Check if maintenance tracking is used | ⚠️ REVIEW |

## 📊 Analysis Summary

**Total Tables:** 28
- **Critical/Core:** 6 tables ✅
- **Active Features:** 7 tables ✅
- **Configuration:** 8 tables ⚠️
- **Likely Unused:** 7 tables 🗑️

## 🔍 How to Verify

### Step 1: Run Analysis
```sql
-- In Supabase SQL Editor:
\i migrations/analyze_table_usage.sql
```

This will show:
- ✅ Row counts for each table
- ✅ Foreign key dependencies
- ✅ RLS policy coverage
- ✅ Recommendations

### Step 2: Review Results
Check which tables have:
- 0 rows
- No RLS policies
- No foreign keys
- Not referenced in code

### Step 3: Safe Cleanup
```sql
-- In Supabase SQL Editor:
\i migrations/cleanup_unused_tables.sql
```

This will:
- ✅ Analyze each table
- ✅ Show what can be removed
- ⚠️ NOT actually drop (commented out for safety)
- 📋 Give you DROP commands to run manually

## 🎯 Recommended Cleanup Actions

### 1. Definitely Remove (if empty):
```sql
DROP TABLE IF EXISTS public.user_roles CASCADE;
```
**Reason:** Completely redundant with `user_profiles.role` column

### 2. Probably Remove (if empty and no policies):
```sql
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.pilot_currency CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
```

### 3. Review Configuration Tables:
Check if these are populated or used:
- `membership_tiers` - May be hardcoded in frontend
- `pricing_snapshots` - Historical data, may want to archive
- `maintenance_due` - Check if maintenance tracking is active

## ⚠️ Important Notes

1. **ALWAYS backup before dropping tables:**
   ```bash
   # Supabase auto-backups, but verify:
   # Dashboard → Database → Backups
   ```

2. **Check for hidden dependencies:**
   - Frontend code references
   - Trigger functions
   - Computed views
   - External integrations

3. **Keep audit trails:**
   If tables have historical data, consider archiving instead of dropping

4. **RLS policies:**
   Tables without policies may still be in use but just not secured properly

## 📝 Next Steps

1. ✅ Run `analyze_table_usage.sql` to see actual data
2. ✅ Review row counts and dependencies
3. ⚠️ Uncomment DROP commands in `cleanup_unused_tables.sql` for tables you want to remove
4. ✅ Run cleanup script
5. ✅ Test application thoroughly
6. ✅ Monitor logs for errors

---

**Generated:** Based on codebase analysis  
**Tables Analyzed:** 28  
**Recommended for Removal:** 6-7 tables  
**Estimated Space Savings:** Depends on data volume



