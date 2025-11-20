# Staff Dashboard Navigation Fix

## Issue
All navigation cards and buttons on the staff dashboard front page (`/admin` or `/staff`) were directing users to the management console but always showing the "Invoices" tab, regardless of which card was clicked.

## Root Cause
In `client/src/pages/staff-home.tsx`, all quick access cards had the same `path: managePath` without any tab identifier, causing them to navigate to the same default view.

## Solution
Updated the navigation system to use URL query parameters to specify which tab should be displayed:

### Changes Made

#### 1. Updated Quick Access Cards (`staff-home.tsx`)
Modified all quick access cards to include a `?tab=` query parameter:
- **Service Requests** → `?tab=requests`
- **Aircraft Fleet** → `?tab=aircraft`
- **Maintenance** → `?tab=maintenance`
- **Clients** → `?tab=clients`
- **Invoices** → `?tab=invoices`
- **Reports** → `?tab=reports`

#### 2. Updated Attention Items (`staff-home.tsx`)
Modified attention items to navigate to appropriate tabs:
- Pending service requests → `?tab=requests`
- Overdue maintenance items → `?tab=maintenance`

#### 3. Updated Staff Dashboard (`staff-dashboard.tsx`)
- Added logic to read the `tab` query parameter from the URL
- Changed the Tabs component from `defaultValue="invoices"` to a controlled component using `value={activeTab}` and `onValueChange={setActiveTab}`
- Tabs now open to the correct section based on the URL parameter

## Testing
To verify the fix works:
1. Navigate to `/admin` or `/staff` (Staff Home)
2. Click on any quick access card (e.g., "Aircraft Fleet")
3. Verify that the management console opens to the correct tab (Aircraft in this case)
4. Test all cards to ensure each navigates to its respective tab
5. Verify attention items also navigate to the correct tabs

## Files Modified
- `client/src/pages/staff-home.tsx`
- `client/src/pages/staff-dashboard.tsx`

