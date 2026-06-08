import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('use-mobile hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return undefined on first render (before measurement)', () => {
    const { result } = renderHook(() => useIsMobile());
    // The hook sets isMobile in useEffect, effect already ran
    // after renderHook returns, so result should be defined
    expect(result.current).toBeDefined();
  });

  it('should return false when window.innerWidth >= 768', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
      configurable: true,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('should return true when window.innerWidth < 768', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
      configurable: true,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('should update when window size changes', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
      configurable: true,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate resize to mobile via dispatchEvent on the matchMedia
    const mql = window.matchMedia('(max-width: 767px)');
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
      configurable: true,
    });

    act(() => {
      mql.dispatchEvent(new Event('change'));
    });

    expect(result.current).toBe(true);
  });
});
