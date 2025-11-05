import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest } from './queryClient';

// throwIfResNotOk is not exported, so we'll test it indirectly through apiRequest

// Mock fetch globally
global.fetch = vi.fn();

describe('queryClient utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // throwIfResNotOk is tested indirectly through apiRequest
  describe('throwIfResNotOk (tested via apiRequest)', () => {
    it('should not throw for successful responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as any;

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(apiRequest('GET', '/api/test')).resolves.not.toThrow();
    });
  });

  describe('apiRequest', () => {
    it('should make GET request without body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as Response;

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await apiRequest('GET', '/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        body: undefined,
        credentials: 'include',
      });
      expect(result).toBe(mockResponse);
    });

    it('should make POST request with JSON body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as Response;

      const requestData = { key: 'value' };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await apiRequest('POST', '/api/test', requestData);

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        credentials: 'include',
      });
      expect(result).toBe(mockResponse);
    });

    it('should throw error for failed requests', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      } as Response;

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('500: Server error');
    });

    it('should handle different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as Response;

      for (const method of methods) {
        (global.fetch as any).mockResolvedValueOnce(mockResponse);
        await apiRequest(method, '/api/test');
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method })
        );
      }
    });

    it('should include credentials in all requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      } as Response;

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await apiRequest('GET', '/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: 'include' })
      );
    });
  });
});

