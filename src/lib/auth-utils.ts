import { supabase } from './supabase';

function isInvalidRefreshTokenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Refresh Token|Invalid Refresh Token/i.test(message);
}

/**
 * Get a valid auth token, refreshing the session if necessary
 */
export async function getValidAuthToken(): Promise<string | null> {
  try {
    // First try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      if (process.env.NODE_ENV !== 'production') console.error('Session error:', sessionError);
      if (isInvalidRefreshTokenError(sessionError)) {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }
      return null;
    }

    if (session?.access_token) {
      // Check if token is expired (with 5 minute buffer)
      const expiresAt = session.expires_at;
      if (expiresAt && expiresAt * 1000 - Date.now() < 5 * 60 * 1000) {
        if (process.env.NODE_ENV !== 'production') console.log('Token expiring soon, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError && isInvalidRefreshTokenError(refreshError)) {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          return null;
        }
        if (!refreshError && refreshedSession?.access_token) {
          return refreshedSession.access_token;
        }
      }
      return session.access_token;
    }

    // No session, try to refresh
    if (process.env.NODE_ENV !== 'production') console.log('No session found, attempting to refresh...');
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError && isInvalidRefreshTokenError(refreshError)) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      return null;
    }
    if (refreshError || !refreshedSession?.access_token) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to refresh session:', refreshError);
      return null;
    }

    return refreshedSession.access_token;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Error getting auth token:', error);
    if (isInvalidRefreshTokenError(error)) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
    return null;
  }
}

/**
 * Make an authenticated API request with automatic retry on 401
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get a valid token
  let token = await getValidAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated. Please log in.');
  }
  
  // Make the request with the token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  // If we get a 401, try to refresh the token and retry once
  if (response.status === 401) {
    if (process.env.NODE_ENV !== 'production') console.warn('Got 401, refreshing token and retrying...');
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error && isInvalidRefreshTokenError(error)) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      throw new Error('Session expired. Please log in again.');
    }
    if (!error && session?.access_token) {
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (retryResponse.ok) return retryResponse;
    }

    throw new Error('Session expired. Please log in again.');
  }
  
  return response;
}

