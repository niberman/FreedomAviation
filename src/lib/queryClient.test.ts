import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryClient, invalidateQueries } from './queryClient';

describe('queryClient', () => {
  describe('queryClient instance', () => {
    it('should be a QueryClient instance', () => {
      expect(queryClient).toBeDefined();
      expect(typeof queryClient.invalidateQueries).toBe('function');
    });

    it('should have default options configured', () => {
      const options = queryClient.getDefaultOptions();
      expect(options.queries?.staleTime).toBe(60 * 1000);
      expect(options.queries?.refetchOnWindowFocus).toBe(false);
    });
  });

  describe('invalidateQueries helper', () => {
    beforeEach(() => {
      vi.spyOn(queryClient, 'invalidateQueries');
    });

    it('should invalidate queries with a single prefix', () => {
      invalidateQueries('/api/test');
      
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['/api/test'],
      });
    });

    it('should invalidate queries with multiple prefixes', () => {
      vi.clearAllMocks(); // Clear previous test's calls
      invalidateQueries(['/api/test', '/api/users']);
      
      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['/api/test'],
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['/api/users'],
      });
    });
  });
});
