/**
 * Stripe payment integration utilities
 */

import { apiJson } from './api-client';

export interface CreateCheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Create a Stripe checkout session for an invoice.
 * Uses the same authenticated API client as all other app-to-API calls (Bearer token).
 */
export async function createCheckoutSession(
  invoiceId: string,
  userId: string
): Promise<CreateCheckoutSessionResponse> {
  return apiJson<CreateCheckoutSessionResponse>('/api/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ invoiceId, userId }),
  });
}
