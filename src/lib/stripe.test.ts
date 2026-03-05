import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiJson } from './api-client';
import { createCheckoutSession } from './stripe';

vi.mock('./api-client', () => ({
  apiJson: vi.fn(),
}));

describe('Stripe utilities', () => {
  beforeEach(() => {
    vi.mocked(apiJson).mockClear();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const mockResponse = {
        checkoutUrl: 'https://checkout.stripe.com/session/123',
        sessionId: 'cs_test_123',
      };

      vi.mocked(apiJson).mockResolvedValueOnce(mockResponse);

      const result = await createCheckoutSession('invoice-123', 'user-456');

      expect(apiJson).toHaveBeenCalledWith(
        '/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({ invoiceId: 'invoice-123', userId: 'user-456' }),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw when apiJson throws', async () => {
      vi.mocked(apiJson).mockRejectedValueOnce(new Error('Invoice not found'));

      await expect(createCheckoutSession('invalid', 'user-456')).rejects.toThrow('Invoice not found');
    });
  });
});

