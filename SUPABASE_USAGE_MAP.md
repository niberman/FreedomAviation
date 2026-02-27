# Supabase Usage Map — Frontend Codebase

Analysis of **all** Supabase client usage under `src/` (Next.js app: pages, API routes, components, hooks). Scripts under `scripts/` are excluded from this list.

---

## 1. Tables Queried (supabase.from)

| Table | Operations | Columns / Select patterns | Locations |
|-------|------------|---------------------------|-----------|
| **aircraft** | select, insert, update, delete | `*`, `id`, `tail_number`, `id, tail_number`, `id, tail_number, hobbs_hours`, `id, tail_number, model`, `tail_number, make, model, year`, `owner_id` | `useAircraft.ts`, `aircraft-table.tsx`, `dashboard/more/page.tsx`, `staff/aircraft/page.tsx`, `document-management.tsx`, `maintenance-crud.tsx`, `fuel-tracking.tsx`, `flight-logs-list.tsx`, `clients-table.tsx`, `staff-home-page.tsx`, `owner-dashboard-page.tsx`, `onboarding-page.tsx`, `api/aircraft/route.ts`, `api/clients/route.ts`, `api/onboarding/welcome-email/route.ts`, `staff-dashboard.tsx` (via aircraft) |
| **aircraft_documents** | select, insert, delete | `*`, `id` (count), `*, aircraft:aircraft_id(tail_number), uploader:uploaded_by(full_name)` | `document-management.tsx` |
| **cfi_schedule** | select, insert, update | `*`, `id`, `google_calendar_event_id` | `cfi-schedule.tsx`, `lib/google-calendar.ts`, `api/google-calendar/sync-slot/route.ts`, `api/google-calendar/sync-all/route.ts` |
| **flight_logs** | select, insert, update | `*`, `id, flight_time_hours, aircraft_id, date`, `*, aircraft:aircraft_id(tail_number), pilot:pilot_id(full_name, email), verifier:verified_by(full_name)`; insert: `aircraft_id, pilot_id, date, departure_airport, arrival_airport, departure_time, arrival_time, flight_time_hours, hobbs_start, hobbs_end, tach_start, tach_end, fuel_added, oil_added, notes, is_verified`; update: `is_verified, verified_by, verified_at` | `flight-logs-list.tsx`, `reports-dashboard.tsx` |
| **fuel_records** | select, insert | `*`, `id`, `*, aircraft:aircraft_id(tail_number)`; insert: `aircraft_id, date, gallons, price_per_gallon, total_cost, fuel_type, vendor, invoice_number, notes, created_by` | `fuel-tracking.tsx` |
| **google_calendar_tokens** | select, insert, update, delete, upsert | `*`, `id`, `sync_enabled, last_sync_at`, `calendar_id` (update) | `lib/google-calendar.ts`, `api/google-calendar/callback/route.ts`, `api/google-calendar/toggle-sync/route.ts`, `api/google-calendar/select-calendar/route.ts`, `api/google-calendar/disconnect/route.ts`, `api/google-calendar/status/route.ts`, `api/google-calendar/sync-all/route.ts` |
| **hangar_reservations** | select | `*`, `hangar_id, hangar_spaces(name, location)` | `hangar-management.tsx`, `api/onboarding/welcome-email/route.ts` |
| **hangar_spaces** | select, insert, update, delete | `id`, `*`, `*, current_tenant:current_tenant_id(full_name, email), current_aircraft:current_aircraft_id(tail_number, model)` | `hangar-management.tsx` |
| **invoice_lines** | select, insert, update, delete | `*`, `invoice_id, description, quantity, unit_cents`, `invoice_id, description, quantity, unit_cents` (in invoice_id list) | `useInvoices.ts`, `staff-home-page.tsx`, `dashboard/more/page.tsx`, `api/invoices/send-email/route.ts` (via invoice select) |
| **invoices** | select, insert, update, delete | `*`, `id, status, paid_date`, `id, created_at, amount, status, category, invoice_number, owner_id, aircraft_id, notes`, `*, invoice_lines(*), owner:owner_id(id, full_name, email), aircraft:aircraft_id(id, tail_number)`, `*, aircraft:aircraft_id(tail_number), owner:owner_id(full_name, email), invoice_lines(description, quantity, unit_cents)`, `*, invoice_lines(*)`; insert: `owner_id, aircraft_id, amount, status, category, due_date, created_by_cfi_id`; update: `status`, `stripe_checkout_session_id`, `amount` | `useInvoices.ts`, `staff-home-page.tsx`, `dashboard/more/page.tsx`, `clients-table.tsx`, `reports-dashboard.tsx`, `api/invoices/send-email/route.ts`, `api/stripe/create-checkout-session/route.ts`, `api/stripe/webhook/route.ts` |
| **maintenance** | select, insert, update, delete | `*`, `id, aircraft_id, item_name, due_date, due_hobbs, status, aircraft:aircraft_id(tail_number, hobbs_hours)`, `id, status, due_date, due_hobbs`; insert: `aircraft_id, item_name, due_date, due_hobbs, status, notes`; update: status/other fields | `maintenance-crud.tsx`, `staff/operations/page.tsx`, `staff-dashboard.tsx`, `reports-dashboard.tsx` |
| **membership_quotes** | insert | `user_id`, `package_id`, `tier_name` (+ quote payload) | `login-page.tsx`, `unified-pricing-calculator.tsx`, `QuoteStep.tsx` |
| **memberships** | select | `tier, aircraft_id, tier_id` | `owner-dashboard-page.tsx`, `api/onboarding/welcome-email/route.ts` |
| **membership_tiers** | select | `name, base_price` | `api/onboarding/welcome-email/route.ts` |
| **notification_preferences** | select, insert | `*`, default prefs insert | `notification-preferences.tsx` |
| **notifications** | select, update, delete | `id` (count), `*`; update: read/mark read; delete | `notification-center.tsx` |
| **onboarding_data** | select, insert | `*`; insert: onboarding payload | `onboarding-page.tsx` |
| **pricing_classes** | select, upsert | `*` | `usePricing.ts` |
| **pricing_locations** | select, upsert | `*` | `usePricing.ts` |
| **pricing_snapshots** | select, insert | `*` | `usePricing.ts` |
| **settings_pricing_assumptions** | select, upsert | `*`, `id` | `usePricing.ts` |
| **aircraft_pricing_overrides** | select, upsert | `*` | `usePricing.ts` |
| **service_requests** | select, insert, update | `*`, `id, service_type, requested_departure, requested_date, requested_time, description, notes, status, priority, airport, created_at, aircraft_id, user_id, aircraft:aircraft_id(tail_number), owner:user_id(full_name, email)`, `*, owner:user_id(full_name,email), aircraft:aircraft_id(tail_number)`, `id, status, created_at, service_type`; insert: `aircraft_id, user_id, service_type`, + description/notes/date/etc.; update: `status`, other fields | `useServiceRequests.ts`, `staff/operations/page.tsx`, `staff-home-page.tsx`, `staff-dashboard.tsx`, `ramp-dashboard.tsx`, `kanban-board.tsx`, `service-request-dialog.tsx`, `service-request-edit-dialog.tsx`, `request-service-sheet.tsx`, `request-instruction-sheet.tsx`, `prepare-aircraft-sheet.tsx`, `QuickActions.tsx`, `reports-dashboard.tsx`, `aircraft-table.tsx`, `api/service-requests/route.ts`, `api/service-requests/[id]/route.ts` |
| **service_tasks** | select, insert | `*`; insert: `aircraft_id, user_id, type` (+ task payload) | `dashboard/more/page.tsx`, `aircraft-table.tsx` |
| **user_profiles** | select, insert, update, upsert | `*`, `id`, `role`, `id, role`, `id, full_name, email`, `id, email, full_name, role, phone, created_at`, `email, full_name`, `role`; update: role, name, phone, etc. | `navbar.tsx`, `api-auth.ts`, `staff-protected-route.tsx`, `(staff)/layout.tsx`, `login-page.tsx`, `owner-dashboard-page.tsx`, `staff-home-page.tsx`, `staff-management.tsx`, `service-request-edit-dialog.tsx`, `clients-table.tsx`, `cfi-schedule.tsx`, `useUserProfile.ts`, `useInvoices.ts`, `api/clients/route.ts`, `api/onboarding/welcome-email/route.ts`, `api/invoices/send-email/route.ts`, `api/stripe/create-checkout-session/route.ts`, `api/staff/create/route.ts`, `onboarding-page.tsx` |

---

## 2. Remote procedure calls (supabase.rpc)

| RPC | Parameters | Purpose | Locations |
|-----|-------------|--------|-----------|
| **create_instruction_invoice** | `p_owner_id`, `p_aircraft_id`, `p_description`, `p_hours`, `p_rate_cents`, `p_cfi_id` | Create instruction invoice and return invoice id | `src/hooks/useCreateInvoice.ts` |
| **create_maintenance_invoice** | `p_owner_id`, `p_aircraft_id`, `p_notes`, `p_line_items` (array of `description`, `quantity`, `unit_cents`), `p_created_by` | Create maintenance invoice with line items; returns invoice id | `src/hooks/useCreateInvoice.ts` |
| **finalize_invoice** | `p_invoice_id` | Finalize invoice after creation | `src/hooks/useCreateInvoice.ts` |
| **exec_sql** | `query` or `sql` / `sql_query` (raw SQL string) | Run raw SQL (admin/tooling). Used in frontend only in `hangar-management.tsx` and `fuel-tracking.tsx` for table existence / DDL. | `src/components/hangar-management.tsx`, `src/components/fuel-tracking.tsx` |

*Scripts (excluded from this map) also use: `exec_sql`, `exec`, `get_enum_values`, `get_table_policies`, `check_function_exists`, `is_staff_user`, `get_rls_policies_with_founder`.*

---

## 3. Storage buckets

| Bucket | Operations | Usage |
|--------|-------------|--------|
| **aircraft-documents** | upload, download, remove (delete object) | `document-management.tsx`: upload document files, download by `file_url`, remove object by path. Path pattern: `{aircraft_id}/{documentType}_{timestamp}.{ext}`. |

---

## 4. Summary checklist

**Tables (26):**  
`aircraft`, `aircraft_documents`, `cfi_schedule`, `flight_logs`, `fuel_records`, `google_calendar_tokens`, `hangar_reservations`, `hangar_spaces`, `invoice_lines`, `invoices`, `maintenance`, `membership_quotes`, `memberships`, `membership_tiers`, `notification_preferences`, `notifications`, `onboarding_data`, `pricing_classes`, `pricing_locations`, `pricing_snapshots`, `settings_pricing_assumptions`, `aircraft_pricing_overrides`, `service_requests`, `service_tasks`, `user_profiles`.

**RPCs (4 in app code):**  
`create_instruction_invoice`, `create_maintenance_invoice`, `finalize_invoice`, `exec_sql`.

**Storage buckets (1):**  
`aircraft-documents`.

---

*Generated from frontend codebase under `src/`. Scripts in `scripts/` were not included in the table/RPC/storage lists.*
