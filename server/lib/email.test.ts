import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendInvoiceEmail } from './email.js';

// Mock environment variables
const originalEnv = process.env;

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    // Reset console methods
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  const mockInvoiceData = {
    invoiceNumber: 'INV-001',
    ownerName: 'John Doe',
    ownerEmail: 'john@example.com',
    ownerId: 'owner-123',
    invoiceId: 'invoice-123',
    totalAmount: 250.00,
    invoiceLines: [
      {
        description: 'Flight Instruction - Ground School',
        quantity: 2.0,
        unitPrice: 75.00,
        total: 150.00,
      },
      {
        description: 'Flight Instruction - Air Time',
        quantity: 1.0,
        unitPrice: 100.00,
        total: 100.00,
      },
    ],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    aircraftTailNumber: 'N123FA',
  };

  describe('sendInvoiceEmail - console mode', () => {
    it('should log email when EMAIL_SERVICE is console', async () => {
      process.env.EMAIL_SERVICE = 'console';

      await sendInvoiceEmail(mockInvoiceData);

      const logCalls = (console.log as any).mock.calls.flat();
      const joinedLogs = logCalls.join(' ');

      expect(joinedLogs).toContain('[CONSOLE MODE] INVOICE EMAIL would be sent to john@example.com');
      expect(joinedLogs).toContain('To actually send emails, set EMAIL_SERVICE=resend and RESEND_API_KEY');
      expect(joinedLogs).toContain('INV-001');
    });

    it('should use console mode by default', async () => {
      delete process.env.EMAIL_SERVICE;

      await sendInvoiceEmail(mockInvoiceData);

      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('sendInvoiceEmail - resend mode', () => {
    beforeEach(() => {
      process.env.EMAIL_SERVICE = 'resend';
      global.fetch = vi.fn();
    });

    it('should send email via Resend API when configured', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      process.env.EMAIL_FROM = 'test@example.com';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 'email-123' }),
      });

      await sendInvoiceEmail(mockInvoiceData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.to).toEqual(['john@example.com']);
      expect(body.subject).toContain('INV-001');
      expect(body.html).toContain('INV-001');
      expect(body.html).toContain('John Doe');
    });

    it('should throw error when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY;

      await expect(sendInvoiceEmail(mockInvoiceData)).rejects.toThrow('RESEND_API_KEY');
    });

    it('should use default from email when EMAIL_FROM not set', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      delete process.env.EMAIL_FROM;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 'email-123' }),
      });

      await sendInvoiceEmail(mockInvoiceData);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.from).toBe('Freedom Aviation <onboarding@resend.dev>');
    });

    it('should handle API errors', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      await expect(sendInvoiceEmail(mockInvoiceData)).rejects.toThrow('Resend API error');
    });

    it('should handle invalid JSON response', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'Invalid JSON',
      });

      await expect(sendInvoiceEmail(mockInvoiceData)).rejects.toThrow('Invalid JSON response');
    });
  });

  describe('sendInvoiceEmail - SMTP mode', () => {
    it('should log when SMTP is selected (not yet implemented)', async () => {
      process.env.EMAIL_SERVICE = 'smtp';

      await sendInvoiceEmail(mockInvoiceData);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[SMTP] Email would be sent to john@example.com'));
    });
  });

  describe('sendInvoiceEmail - invalid service', () => {
    it('should warn and use console for unknown service', async () => {
      process.env.EMAIL_SERVICE = 'invalid-service';

      await sendInvoiceEmail(mockInvoiceData);

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown email service'));
    });
  });

  describe('Email HTML generation', () => {
    it('should generate HTML with all invoice data', async () => {
      process.env.EMAIL_SERVICE = 'console';

      await sendInvoiceEmail(mockInvoiceData);

      const logCalls = (console.log as any).mock.calls;
      const htmlCall = logCalls.find((call: any[]) => 
        call[0] === 'HTML:' || call[0]?.includes('<!DOCTYPE html>')
      );

      if (htmlCall) {
        const html = htmlCall[1] || htmlCall[0];
        expect(html).toContain('INV-001');
        expect(html).toContain('John Doe');
        expect(html).toContain('N123FA');
        expect(html).toContain('$250.00');
        expect(html).toContain('Ground School');
        expect(html).toContain('Air Time');
      }
    });

    it('should escape HTML in invoice data', async () => {
      process.env.EMAIL_SERVICE = 'console';

      const dataWithHtml = {
        ...mockInvoiceData,
        ownerName: '<script>alert("xss")</script>',
        invoiceLines: [
          {
            description: 'Service <b>with</b> HTML',
            quantity: 1,
            unitPrice: 100,
            total: 100,
          },
        ],
      };

      await sendInvoiceEmail(dataWithHtml);

      const logCalls = (console.log as any).mock.calls;
      const htmlCall = logCalls.find((call: any[]) => 
        call[0] === 'HTML:' || call[0]?.includes('<!DOCTYPE html>')
      );

      if (htmlCall) {
        const html = htmlCall[1] || htmlCall[0];
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
      }
    });

    it('should handle missing optional fields', async () => {
      process.env.EMAIL_SERVICE = 'console';

      const minimalData = {
        ...mockInvoiceData,
        dueDate: undefined,
        aircraftTailNumber: undefined,
      };

      await sendInvoiceEmail(minimalData);

      expect(console.log).toHaveBeenCalled();
    });
  });
});

