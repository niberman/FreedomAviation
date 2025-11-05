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
  // Use absolute URL to avoid CORS issues with redirects
  // In production, always use canonical domain to avoid www redirect issues
  let apiUrl: string;
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // If on non-www in production, use www to avoid redirect CORS issues
    if (origin === "https://freedomaviationco.com") {
      apiUrl = "https://www.freedomaviationco.com/api/stripe/create-checkout-session";
    } else {
      apiUrl = `${origin}/api/stripe/create-checkout-session`;
    }
  } else {
    apiUrl = "/api/stripe/create-checkout-session";
  }
  
  const response = await fetch(apiUrl, {
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

