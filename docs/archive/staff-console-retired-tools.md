# Staff Console Retired Tools (2026-02-12)

This archive records the tools removed from active Staff/Admin console navigation:

- `hangars`
- `documents`
- `fuel`
- `schedule`
- `logs` (Flight Logs)
- `invoices`
- `reports`

## What was changed

- Removed quick-action buttons from:
  - `src/components/pages/staff-home-page.tsx`
  - `client/src/pages/staff-home.tsx`
- Removed corresponding tabs/routes from:
  - `src/components/pages/staff-dashboard.tsx`
  - `client/src/pages/staff-dashboard.tsx`
- Updated tests to stop asserting retired tabs:
  - `client/src/pages/staff-dashboard.test.tsx`

## Archived implementation locations

The underlying feature components still exist in the codebase for historical reference and possible future reactivation:

- `src/components/hangar-management.tsx`
- `src/components/document-management.tsx`
- `src/components/fuel-tracking.tsx`
- `src/components/cfi-schedule.tsx`
- `src/components/flight-logs-list.tsx`
- `src/components/staff-dashboard/InvoicesTab.tsx`
- `src/components/reports-dashboard.tsx`

Client-side mirrors also remain:

- `client/src/components/hangar-management.tsx`
- `client/src/components/document-management.tsx`
- `client/src/components/fuel-tracking.tsx`
- `client/src/components/cfi-schedule.tsx`
- `client/src/components/flight-logs-list.tsx`
- `client/src/components/staff-dashboard/InvoicesTab.tsx`
- `client/src/components/reports-dashboard.tsx`
