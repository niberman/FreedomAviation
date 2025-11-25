# Ramp Operations Dashboard - Mobile-First Design

## Overview
The new Ramp Operations Dashboard is a mobile-first, card-based interface designed for ground crew and ramp operations staff. It provides a streamlined, touch-friendly workflow for managing aircraft staging, fueling, and services.

## Key Features

### 1. **Live Header with Real-Time Status**
- **Left**: "Ramp Ops" title with pulsing green dot indicating live Supabase Realtime connection
- **Center**: Current date and live clock (updates every second)
- **Right**: Notification bell with badge count and user profile icon

### 2. **Todo/Done Tab System**
- **To Do Tab**: Shows all pending jobs with a count badge
- **Done Tab**: Shows completed jobs for the current session

### 3. **Mobile-First Job Cards**

Each job card features:

#### **Top Row**
- Aircraft tail number in large, bold font (e.g., N828TW)
- Pull-out time in a prominent badge (e.g., "14:00")

#### **Middle Row - Service Badges**
Large, tappable service badges with color coding:
- **FUEL** badges (red) - Shows gallons if specified
- **HEAT** badges (orange) - Aircraft heating
- **STAGE** badges (blue) - Staging/positioning
- **OTHER** services (gray)

#### **Bottom Row - Actions**
- **Full-width green button**: "MARK STAGED" - Primary action
- **Secondary text link**: "Report Issue" - Opens squawk form

#### **Border Color Coding**
- **Blue left border**: Normal priority
- **Red left border**: Urgent priority

### 4. **Completed Jobs View**
- Grayed out cards with strikethrough text
- Shows completion time and user
- **Undo button** for accidental completions

### 5. **Floating Action Button (FAB)**
- Blue circle with "+" icon in bottom-right corner
- Opens dialog to add ad-hoc moves (manual entries)
- Examples: "Moved N345FA to wash bay", "Refueled during hangar move"

### 6. **Real-Time Updates**
- Supabase Realtime subscription to `service_requests` table
- Auto-refreshes every 30 seconds
- Shows toast notification: "New Request!" when jobs are added
- Live connection status indicator

## Technical Implementation

### Data Source
Uses existing `service_requests` table with smart mapping:
- `requested_date` → pull-out time
- `service_type` → parsed into service badges
- `priority` → urgent/normal styling
- `status` → pending/completed state

### Service Badge Parsing
The system intelligently parses services:
```typescript
"fuel" → FUEL badge (extracts gallons from notes)
"heat" → HEAT badge
"stage, move" → STAGE badge
```

### Real-Time Architecture
```typescript
supabase
  .channel("ramp-jobs-changes")
  .on("postgres_changes", { table: "service_requests" })
  .subscribe()
```

## Mobile-First Design Principles

1. **Large Touch Targets**: All buttons and badges are at least 44x44px
2. **High Contrast**: Bold text and distinct colors for outdoor visibility
3. **Single Column Layout**: Optimized for one-handed phone use
4. **Minimal Scrolling**: Key information visible without scrolling
5. **Progressive Disclosure**: Details hidden until needed

## Usage Workflow

### For Ground Crew:
1. Open dashboard (defaults to Ramp Ops tab)
2. See all pending jobs in To Do tab
3. Tap service badges to view details
4. Complete services
5. Tap "MARK STAGED" when aircraft ready
6. Job moves to Done tab automatically

### For Supervisors:
1. View Done tab to see completed work
2. Check completion times and staff
3. Use Undo if needed
4. Add ad-hoc moves via FAB

## Integration Points

### With Existing Systems:
- Uses `service_requests` table (no new tables needed)
- Integrates with existing authentication
- Works with current notification system
- Accessible from staff dashboard tabs

### Future Enhancements:
- GPS-based location tracking for "STAGE" location
- Photo attachments for completed work
- Time tracking per service
- Weather integration
- Push notifications for urgent jobs

## Access

**URL**: `/staff-dashboard` (first tab: "Ramp Ops")

**Permissions**: Staff and admin roles can access

## Mobile Screenshot Wireframe

```
┌─────────────────────────────────┐
│ Ramp Ops         15:45:32     [B][U]│ ← Header
│              Tue, Nov 25         │
├─────────────────────────────────┤
│  [  To Do (3)  ] [  Done  ]     │ ← Tabs
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │[PLANE] N828TW     [14:00]   │ │ ← Job Card
│ │                             │ │
│ │ [FUEL:40G] [HEAT] [STAGE]  │ │ ← Services
│ │                             │ │
│ │ ┌───────────────────────┐  │ │
│ │ │   MARK STAGED         │  │ │ ← Action
│ │ └───────────────────────┘  │ │
│ │      Report Issue          │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │[PLANE] N345FA     [15:00]   │ │
│ │ URGENT                      │ │
│ │ [FUEL:25G] [STAGE]         │ │
│ │ ┌───────────────────────┐  │ │
│ │ │   MARK STAGED         │  │ │
│ │ └───────────────────────┘  │ │
│ └─────────────────────────────┘ │
│                                 │
│                            ┌──┐ │
│                            │+│ │ ← FAB
│                            └──┘ │
└─────────────────────────────────┘
```

## Benefits

1. **Speed**: Jobs can be completed in 2 taps
2. **Mobile-Optimized**: Works great on phones in outdoor conditions
3. **Real-Time**: Always shows current status
4. **Visibility**: High contrast for outdoor readability
5. **One-Handed**: Can operate with gloves on
6. **Tracking**: Auto-tracks completion times and staff
7. **Alerts**: Never miss urgent requests

## Configuration

No additional configuration needed! Works with existing:
- Service requests table
- User authentication
- Supabase real-time

Just navigate to the Ramp Ops tab and start using it!

