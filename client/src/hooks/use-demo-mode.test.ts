import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDemoMode } from './use-demo-mode';

// Mock window.location
const mockLocation = {
  search: '',
};

Object.defineProperty(window, 'location', {
  writable: true,
  value: mockLocation,
});

describe('useDemoMode', () => {
  beforeEach(() => {
    mockLocation.search = '';
  });

  it('should return isDemo false when readonly param is not set', () => {
    mockLocation.search = '';
    const { result } = renderHook(() => useDemoMode());
    
    expect(result.current.isDemo).toBe(false);
    expect(result.current.seed).toBeNull();
  });

  it('should return isDemo true when readonly=1', () => {
    mockLocation.search = '?readonly=1';
    const { result } = renderHook(() => useDemoMode());
    
    expect(result.current.isDemo).toBe(true);
  });

  it('should return seed when seed param is provided', () => {
    mockLocation.search = '?seed=test-seed-123';
    const { result } = renderHook(() => useDemoMode());
    
    expect(result.current.seed).toBe('test-seed-123');
    expect(result.current.isDemo).toBe(false);
  });

  it('should handle both readonly and seed params', () => {
    mockLocation.search = '?readonly=1&seed=test-seed';
    const { result } = renderHook(() => useDemoMode());
    
    expect(result.current.isDemo).toBe(true);
    expect(result.current.seed).toBe('test-seed');
  });

  it('should not be demo when readonly has other values', () => {
    mockLocation.search = '?readonly=0';
    const { result } = renderHook(() => useDemoMode());
    
    expect(result.current.isDemo).toBe(false);
  });
});

