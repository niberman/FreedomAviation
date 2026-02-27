# Schema vs Frontend: Orphaned Tables, Unused Columns, Unreferenced Functions

Comparison of the **active SQL schema** (migrations through `20260227214308_remote_schema.sql`) against the **frontend usage** documented in `SUPABASE_USAGE_MAP.md`. Only items **present in the schema but completely absent from the TSX/codebase** are listed.

---

## 1. Orphaned tables

Tables that exist in the schema but are **never** referenced by `supabase.from('...')` in the frontend.

| Table | Notes |
|-------|--------|
| **client_billing_profiles** | No `.from('client_billing_profiles')` in `src/` |
| **consumable_events** | No `.from('consumable_events')` in `src/` |
| **credit_transactions** | No `.from('credit_transactions')` in `src/` |
| **email_notifications** | Written only by trigger `notify_service_request_created`; no direct frontend access |
| **instruction_requests** | No `.from('instruction_requests')` in `src/` |
| **service_credits** | No `.from('service_credits')` in `src/` |
| **settings** | No `.from('settings')` in `src/` (distinct from `settings_pricing_assumptions`) |
| **support_tickets** | No `.from('support_tickets')` in `src/` |

---

## 2. Unused columns

Columns that exist on **used** tables in the schema but are **never** selected, inserted, or updated in the frontend (no explicit reference and not covered by a `*`-only pattern for that table). Columns only used inside triggers or other DB functions are still counted as unused by the frontend.

| Table | Column | Notes |
|-------|--------|--------|
| **flight_logs** | landings | Not in any frontend select/insert/update |
| **flight_logs** | night_time | Not in any frontend select/insert/update |
| **flight_logs** | instrument_time | Not in any frontend select/insert/update |
| **flight_logs** | cross_country | Not in any frontend select/insert/update |
| **flight_logs** | remarks | Not in any frontend select/insert/update |
| **fuel_records** | location | Not in any frontend select/insert/update |
| **fuel_records** | hobbs_at_fuel | Not in any frontend select/insert/update |
| **fuel_records** | tach_at_fuel | Not in any frontend select/insert/update |
| **maintenance** | due_tach | Not in any frontend select/insert/update |
| **maintenance** | description | Not in any frontend select/insert/update (only item_name, due_date, due_hobbs, status, notes, completed_date are used) |
| **membership_quotes** | base_monthly | Frontend insert uses user_id, package_id, tier_name (+ payload); not this |
| **membership_quotes** | hangar_id | Not in frontend insert/select |
| **membership_quotes** | hangar_cost | Not in frontend insert/select |
| **membership_quotes** | total_monthly | Not in frontend insert/select |
| **membership_quotes** | aircraft_tail | Not in frontend insert/select |
| **membership_quotes** | aircraft_make | Not in frontend insert/select |
| **membership_quotes** | aircraft_model | Not in frontend insert/select |
| **membership_quotes** | status | Not in frontend insert/select |
| **membership_quotes** | notes | Not in frontend insert/select |
| **membership_tiers** | description | Frontend only uses name, base_price |
| **membership_tiers** | min_hours_per_month | Not referenced |
| **membership_tiers** | max_hours_per_month | Not referenced |
| **membership_tiers** | credit_multiplier | Not referenced |
| **membership_tiers** | is_active | Not referenced |
| **membership_tiers** | created_at | Not referenced |
| **membership_tiers** | updated_at | Not referenced |
| **memberships** | start_date | Not in frontend select (only tier, aircraft_id, tier_id used) |
| **memberships** | end_date | Not in frontend select |
| **memberships** | is_active | Not in frontend select |
| **memberships** | created_at | Not in frontend select |
| **memberships** | updated_at | Not in frontend select |
| **service_requests** | service_id | Not in any frontend select/insert/update (assigned_to, fuel_grade, etc. are used) |

---

## 3. Unreferenced functions

Functions that exist in the schema (including later migrations) but are **never** invoked via `supabase.rpc('...')` in the frontend. Trigger-only or auth-trigger functions are still listed as unreferenced from application code.

| Function | Notes |
|----------|--------|
| **afs_enforce_capacity** | Not called via `.rpc()` in `src/` |
| **after_fuel_log_create_charge** | Not called via `.rpc()` (likely trigger) |
| **after_fuel_log_update_status** | Not called via `.rpc()` (likely trigger) |
| **assign_default_role** | Not called via `.rpc()` (likely trigger) |
| **can_view_all_profiles** | Not called via `.rpc()` in `src/` |
| **create_notification** | Not called via `.rpc()` in `src/` |
| **debug_user_profile_role_value** | Not called via `.rpc()` in `src/` |
| **fuel_logs_set_type** | Not called via `.rpc()` (likely trigger) |
| **fuel_orders_apply_directive** | Not called via `.rpc()` in `src/` |
| **fuel_orders_compute** | Not called via `.rpc()` in `src/` |
| **get_founder_emails** | Not called via `.rpc()` in `src/` (used by backend/email only) |
| **get_ops_emails** | Not called via `.rpc()` in `src/` |
| **get_staff_emails** | Not called via `.rpc()` in `src/` |
| **handle_new_user** | Not called via `.rpc()` (auth trigger) |
| **notify_schedule_change** | Not called via `.rpc()` (likely trigger) |
| **notify_service_request_created** | Trigger-only; not called via `.rpc()` |
| **refresh_membership_quotes** | Not called via `.rpc()` in `src/` |
| **set_fuel_snapshot** | Not called via `.rpc()` in `src/` |
| **set_updated_at** | Not called via `.rpc()` (likely trigger) |
| **tg_set_updated_at** | Not called via `.rpc()` (likely trigger) |
| **update_updated_at** | Not called via `.rpc()` (likely trigger) |

**Dropped in schema:** `get_cfi_emails` is dropped in `20260227214308_remote_schema.sql`, so it is not listed as unreferenced.

**Referenced by frontend (for reference):** `create_instruction_invoice`, `create_maintenance_invoice`, `finalize_invoice`, `exec_sql`.

---

## Summary counts

| Category | Count |
|----------|--------|
| Orphaned tables | 8 |
| Unused columns | 31 (across 8 tables) |
| Unreferenced functions | 21 |
