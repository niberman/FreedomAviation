import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDemoMode } from './use-demo-mode';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

const mockUsePathname = vi.mocked(usePathname);

describe('useDemoMode', () => {
  it('should return isDemo false when not on /demo path', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    const { result } = renderHook(() => useDemoMode());
    
    expect(result.current.isDemo).toBe(false);
  });

  it('should return isDemo true when on /demo path', () => {
    mockUsePathname.mockReturnValue('/demo');
    const { result } = renderHook(() => useDemoMode());
    
    expect(result.current.isDemo).toBe(true);
  });

  it('should return isDemo false for paths starting with /demo but not exactly /demo', () => {
    mockUsePathname.mockReturnValue('/demo/test');
    const { result } = renderHook(() => useDemoMode());
    
    expect(result.current.isDemo).toBe(false);
  });

  it('should return isDemo false for root path', () => {
    mockUsePathname.mockReturnValue('/');
    const { result } = renderHook(() => useDemoMode());
    
    expect(result.current.isDemo).toBe(false);
  });
});
