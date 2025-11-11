# Google Integration Guide

## Overview

Freedom Aviation supports Google OAuth for authentication and Google Calendar integration for CFI scheduling.

## Google OAuth Sign-In

### Quick Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable OAuth Consent Screen

2. **Configure OAuth Client**
   - Type: Web application
   - Authorized redirect URI: `https://wsepwuxkwjnsgmkddkjw.supabase.co/auth/v1/callback`

3. **Configure in Supabase**
   - Dashboard → Authentication → Providers → Enable Google
   - Add your Client ID and Client Secret

### Implementation Details

Users can sign in with Google in addition to email/password. The auth flow:
1. User clicks "Sign in with Google"
2. Redirects to Google consent screen
3. Returns to Supabase callback
4. User redirected to appropriate dashboard
5. Database trigger creates user profile automatically

## Google Calendar Integration

### Features

- OAuth 2.0 authentication for secure calendar access
- Two-way sync between CFI schedule and Google Calendar
- Color-coded events (green=available, red=booked, gray=blocked)
- Automatic and manual sync options
- Calendar selection support

### Setup

1. **Enable Google Calendar API**
   - Go to Google Cloud Console
   - APIs & Services → Library
   - Enable "Google Calendar API"

2. **Add Environment Variables**
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google-calendar/callback
   ```

3. **Run Database Migration**
   - Execute `scripts/add-google-calendar-integration.sql` in Supabase SQL Editor
   - Creates `cfi_schedule` and `google_calendar_tokens` tables

### Usage for CFIs

1. Navigate to Staff Dashboard → CFI Schedule
2. Click "Calendar Settings" → "Connect Google Calendar"
3. Authorize in popup window
4. Enable "Automatic Sync" for real-time synchronization

### API Endpoints

- `GET /api/google-calendar/auth-url` - Get OAuth URL
- `GET /api/google-calendar/callback` - OAuth callback
- `GET /api/google-calendar/status` - Check connection status
- `POST /api/google-calendar/disconnect` - Disconnect calendar
- `POST /api/google-calendar/toggle-sync` - Enable/disable auto-sync
- `POST /api/google-calendar/sync-slot` - Sync single slot
- `POST /api/google-calendar/sync-all` - Sync all slots

### Database Schema

#### cfi_schedule Table
- Stores CFI availability slots
- Links to `google_calendar_event_id` for sync tracking

#### google_calendar_tokens Table
- Stores OAuth access and refresh tokens
- Tracks sync status and last sync time
- RLS ensures users only access their own tokens

### Troubleshooting

**"Failed to connect Google Calendar"**
- Verify Calendar API is enabled
- Check OAuth credentials match
- Ensure redirect URI is exact
- Confirm user has CFI or admin role

**Events not syncing**
- Check "Automatic Sync" is enabled
- Try manual sync
- Verify connection status
- Check server logs for errors

## Security

- OAuth tokens stored securely with RLS
- Automatic token refresh
- Only CFI/admin roles can connect calendars
- Credentials never committed to version control

## Production Checklist

- [ ] Update authorized domains in Google Cloud Console
- [ ] Add production redirect URIs
- [ ] Update Supabase Site URL
- [ ] Test full OAuth flow
- [ ] Verify calendar sync works
- [ ] Check token refresh mechanism

## Key Files

- `server/lib/google-calendar.ts` - Calendar service
- `client/src/components/cfi-schedule.tsx` - UI component
- `client/src/lib/auth-context.tsx` - OAuth auth
- `scripts/add-google-calendar-integration.sql` - Database schema

