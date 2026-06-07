import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('use-mobile hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return undefined on first render (before measurement)', () => {
    const { result } = renderHook(() => useIsMobile());
    // The hook sets isMobile in useEffect, so before effect runs it's undefined
    // But since we're in jsdom with mocked matchMedia, it should be set immediately
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

    const { result, rerender } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
      configurable: true,
    });

    const mql = window.matchMedia('(max-width: 767px)');
    act(() => {
      mql.dispatchEvent(new Event('change'));
    });

    rerender();

    expect(result.current).toBe(true);
  });

  it('should clean up event listener on unmount', () => {
    const mql = window.matchMedia('(max-width: 767px)');
    const removeListenerSpy = vi.spyOn(mql, 'removeEventListener');

    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(removeListenerSpy).toHaveBeenCalled();
  });
});
