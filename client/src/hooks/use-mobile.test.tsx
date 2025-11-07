import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  beforeEach(() => {
    // Reset window.matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when window width is less than 768px', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    (window.matchMedia as any).mockReturnValue({
      matches: true,
      media: '(max-width: 767px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (e: any) => void) => {
        // Call handler immediately to simulate initial state
        if (event === 'change') {
          setTimeout(() => handler({ matches: true }), 0);
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useIsMobile());
    // The hook checks window.innerWidth directly, so it should return true
    expect(result.current).toBe(true);
  });

  it('should return false when window width is greater than 768px', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    (window.matchMedia as any).mockReturnValue({
      matches: false,
      media: '(max-width: 767px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (e: any) => void) => {
        // Call handler immediately to simulate initial state
        if (event === 'change') {
          setTimeout(() => handler({ matches: false }), 0);
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useIsMobile());
    // The hook checks window.innerWidth directly, so it should return false
    expect(result.current).toBe(false);
  });
});

