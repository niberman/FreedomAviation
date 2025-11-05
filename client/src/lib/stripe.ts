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
  // Use relative URL to avoid CORS issues - always uses same origin
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoiceId, userId }),
    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = "Unknown error";
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
    } catch (e) {
      // If response isn't JSON, try to get text
      try {
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      } catch (textError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    }
    console.error("Stripe checkout session error:", {
      status: response.status,
      statusText: response.statusText,
      message: errorMessage,
    });
    throw new Error(errorMessage);
  }

  return response.json();
}

