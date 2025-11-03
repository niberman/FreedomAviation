/**
 * Stripe payment integration utilities
 */

export interface CreateCheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Create a Stripe checkout session for an invoice
 */
export async function createCheckoutSession(
  invoiceId: string,
  userId: string
): Promise<CreateCheckoutSessionResponse> {
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoiceId, userId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

