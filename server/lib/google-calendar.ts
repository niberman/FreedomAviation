import { google } from 'googleapis';
import { supabase } from './supabase.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google-calendar/callback';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  status?: 'confirmed' | 'tentative' | 'cancelled';
  colorId?: string;
}

export interface ScheduleSlot {
  id: string;
  cfi_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
  owner_id?: string;
  aircraft_id?: string;
  notes?: string;
  google_calendar_event_id?: string;
}

/**
 * Get OAuth2 client for Google Calendar API
 */
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate OAuth consent URL for user to authorize
 */
export function getAuthorizationUrl(): string {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Get authenticated calendar client for a user
 */
export async function getCalendarClient(userId: string) {
  // Fetch tokens from database
  const { data: tokenData, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    throw new Error('No calendar tokens found for user');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: tokenData.token_expiry ? new Date(tokenData.token_expiry).getTime() : undefined,
  });

  // Handle token refresh automatically
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      // Update tokens in database
      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create a calendar event from a schedule slot
 */
export async function createCalendarEvent(
  userId: string,
  slot: ScheduleSlot,
  calendarId: string = 'primary'
): Promise<string> {
  const calendar = await getCalendarClient(userId);

  // Combine date and time
  const startDateTime = `${slot.date}T${slot.start_time}`;
  const endDateTime = `${slot.date}T${slot.end_time}`;

  // Determine event details based on status
  let summary = '';
  let description = slot.notes || '';
  let colorId = '2'; // Default green for available

  switch (slot.status) {
    case 'available':
      summary = '✈️ Available for Flight Instruction';
      colorId = '2'; // Green
      break;
    case 'booked':
      summary = '✈️ Flight Instruction - Booked';
      colorId = '11'; // Red
      break;
    case 'blocked':
      summary = '🚫 Unavailable';
      colorId = '8'; // Gray
      break;
  }

  const event: CalendarEvent = {
    summary,
    description: description || `Status: ${slot.status}`,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Denver', // Mountain Time - adjust as needed
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Denver',
    },
    colorId,
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data.id!;
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  slot: ScheduleSlot,
  calendarId: string = 'primary'
): Promise<void> {
  const calendar = await getCalendarClient(userId);

  const startDateTime = `${slot.date}T${slot.start_time}`;
  const endDateTime = `${slot.date}T${slot.end_time}`;

  let summary = '';
  let colorId = '2';

  switch (slot.status) {
    case 'available':
      summary = '✈️ Available for Flight Instruction';
      colorId = '2'; // Green
      break;
    case 'booked':
      summary = '✈️ Flight Instruction - Booked';
      colorId = '11'; // Red
      break;
    case 'blocked':
      summary = '🚫 Unavailable';
      colorId = '8'; // Gray
      break;
  }

  const event: CalendarEvent = {
    summary,
    description: slot.notes || `Status: ${slot.status}`,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Denver',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Denver',
    },
    colorId,
  };

  await calendar.events.update({
    calendarId,
    eventId,
    requestBody: event,
  });
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  userId: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  const calendar = await getCalendarClient(userId);

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

/**
 * Import events from Google Calendar to schedule
 */
export async function importCalendarEvents(
  userId: string,
  startDate: string,
  endDate: string,
  calendarId: string = 'primary'
): Promise<any[]> {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.list({
    calendarId,
    timeMin: new Date(startDate).toISOString(),
    timeMax: new Date(endDate).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

/**
 * Sync a schedule slot to Google Calendar
 */
export async function syncSlotToCalendar(
  slot: ScheduleSlot
): Promise<string | null> {
  try {
    // Get user's calendar tokens
    const { data: tokenData } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', slot.cfi_id)
      .single();

    if (!tokenData || !tokenData.sync_enabled) {
      return null; // User hasn't connected calendar or sync is disabled
    }

    const calendarId = tokenData.calendar_id || 'primary';

    // If event already exists, update it
    if (slot.google_calendar_event_id) {
      await updateCalendarEvent(slot.cfi_id, slot.google_calendar_event_id, slot, calendarId);
      return slot.google_calendar_event_id;
    } else {
      // Create new event
      const eventId = await createCalendarEvent(slot.cfi_id, slot, calendarId);
      
      // Update slot with event ID
      await supabase
        .from('cfi_schedule')
        .update({ google_calendar_event_id: eventId })
        .eq('id', slot.id);

      return eventId;
    }
  } catch (error) {
    console.error('Error syncing to Google Calendar:', error);
    throw error;
  }
}

/**
 * Remove calendar event when slot is deleted
 */
export async function removeCalendarEvent(slot: ScheduleSlot): Promise<void> {
  try {
    if (!slot.google_calendar_event_id) {
      return;
    }

    const { data: tokenData } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', slot.cfi_id)
      .single();

    if (!tokenData) {
      return;
    }

    const calendarId = tokenData.calendar_id || 'primary';
    await deleteCalendarEvent(slot.cfi_id, slot.google_calendar_event_id, calendarId);
  } catch (error) {
    console.error('Error removing calendar event:', error);
    // Don't throw - slot deletion should succeed even if calendar sync fails
  }
}

/**
 * Get list of user's calendars
 */
export async function getUserCalendars(userId: string) {
  const calendar = await getCalendarClient(userId);
  
  const response = await calendar.calendarList.list();
  return response.data.items || [];
}

/**
 * Check if user has Google Calendar connected
 */
export async function hasGoogleCalendarConnected(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('id')
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}

