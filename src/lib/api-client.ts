import { authenticatedFetch } from './auth-utils';

/**
 * Parse error body from a non-ok Response and return a consistent Error.
 * Used by apiJson so all API callers get the same error shape.
 */
async function parseApiError(res: Response): Promise<Error> {
  const fallback = res.statusText || 'Request failed';
  try {
    const body = await res.json().catch(() => ({ message: fallback, error: fallback }));
    const message =
      typeof body?.message === 'string'
        ? body.message
        : typeof body?.error === 'string'
          ? body.error
          : fallback;
    if (res.status === 503) return new Error(message || 'Service unavailable. Please try again later.');
    if (res.status === 403) return new Error(message || "You don't have permission to perform this action.");
    if (res.status === 401) return new Error(message || 'Session expired. Please log in again.');
    return new Error(message);
  } catch {
    return new Error(fallback);
  }
}

/**
 * Make an authenticated API request (Bearer token, 401 retry).
 * Use this when you need the raw Response (e.g. for non-JSON or custom handling).
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return authenticatedFetch(url, options);
}

/**
 * Make an authenticated API request and parse JSON.
 * On !res.ok, parses error body and throws a consistent Error.
 * All authenticated app-to-API calls should use this (or apiFetch) for one auth path and one error shape.
 */
export async function apiJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await authenticatedFetch(url, options);
  if (!res.ok) {
    throw await parseApiError(res);
  }
  return res.json() as Promise<T>;
}
