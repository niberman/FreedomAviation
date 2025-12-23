import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCheckoutSession } from './stripe';

// Mock fetch globally
global.fetch = vi.fn();

describe('Stripe utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const mockResponse = {
        checkoutUrl: 'https://checkout.stripe.com/session/123',
        sessionId: 'cs_test_123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createCheckoutSession('invoice-123', 'user-456');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stripe/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ invoiceId: 'invoice-123', userId: 'user-456' }),
          credentials: 'include',
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error with message from JSON error response', async () => {
      const errorResponse = {
        error: 'Invoice not found',
        message: 'The invoice does not exist',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => errorResponse,
      });

      await expect(createCheckoutSession('invalid', 'user-456')).rejects.toThrow('Invoice not found');
    });

    it('should throw error with message from text response when JSON parsing fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
        text: async () => 'Server error text',
      });

      await expect(createCheckoutSession('invoice-123', 'user-456')).rejects.toThrow('Server error text');
    });

    it('should throw error with status text when both JSON and text fail', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
        text: async () => {
          throw new Error('Cannot read text');
        },
      });

      await expect(createCheckoutSession('invoice-123', 'user-456')).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle HTTP error status codes', async () => {
      const statusCodes = [400, 401, 403, 404, 500, 503];
      
      for (const status of statusCodes) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Error',
          json: async () => ({ error: `Error ${status}` }),
        });

        await expect(createCheckoutSession('invoice-123', 'user-456')).rejects.toThrow();
      }
    });
  });
});

