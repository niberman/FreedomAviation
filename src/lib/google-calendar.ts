import { google } from 'googleapis';
import { createAdminClient } from './supabase-server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

function getOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Google Calendar environment variables are not configured');
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);
}

export function getAuthorizationUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

async function getAuthenticatedClient(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data: tokenData, error } = await supabase
    .from('google_calendar_tokens')
    .select('access_token, refresh_token, token_expiry, calendar_id')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    throw new Error('Google Calendar not connected for this user');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? undefined,
    expiry_date: tokenData.token_expiry ? new Date(tokenData.token_expiry).getTime() : undefined,
  });

  oauth2Client.on('tokens', async (newTokens) => {
    const updates: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };
    if (newTokens.access_token) updates.access_token = newTokens.access_token;
    if (newTokens.refresh_token) updates.refresh_token = newTokens.refresh_token;
    if (newTokens.expiry_date) updates.token_expiry = new Date(newTokens.expiry_date).toISOString();

    await supabase
      .from('google_calendar_tokens')
      .update(updates)
      .eq('user_id', userId);
  });

  return { oauth2Client, calendarId: tokenData.calendar_id };
}

export interface CalendarInfo {
  id: string;
  summary: string;
  primary?: boolean;
}

export async function getUserCalendars(userId: string): Promise<CalendarInfo[]> {
  const { oauth2Client } = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.calendarList.list({ minAccessRole: 'writer' });
  const items = response.data.items ?? [];

  return items
    .filter((cal): cal is typeof cal & { id: string; summary: string } => Boolean(cal.id && cal.summary))
    .map((cal) => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary ?? false,
    }));
}

interface ScheduleSlot {
  id: string;
  cfi_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  owner_id?: string;
  notes?: string;
  google_calendar_event_id?: string;
}

export async function syncSlotToCalendar(slot: ScheduleSlot): Promise<string | null> {
  const { oauth2Client, calendarId } = await getAuthenticatedClient(slot.cfi_id);

  if (!calendarId) {
    throw new Error('No calendar selected. Please select a calendar first.');
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const startDateTime = `${slot.date}T${slot.start_time}`;
  const endDateTime = `${slot.date}T${slot.end_time}`;
  const timeZone = 'America/Denver';

  const eventBody = {
    summary: `CFI ${slot.status === 'available' ? 'Available' : slot.status === 'booked' ? 'Booked' : 'Blocked'}`,
    description: slot.notes || undefined,
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
  };

  if (slot.google_calendar_event_id) {
    try {
      const response = await calendar.events.update({
        calendarId,
        eventId: slot.google_calendar_event_id,
        requestBody: eventBody,
      });
      return response.data.id ?? null;
    } catch {
      // Event may have been deleted externally — fall through to create
    }
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: eventBody,
  });

  const eventId = response.data.id ?? null;

  if (eventId) {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from('cfi_schedule')
        .update({ google_calendar_event_id: eventId })
        .eq('id', slot.id);
    }
  }

  return eventId;
}
