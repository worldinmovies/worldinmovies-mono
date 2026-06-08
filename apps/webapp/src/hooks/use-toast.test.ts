import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { useToast as UseToastType, toast as ToastType } from '@/hooks/use-toast';

describe('use-toast hook', () => {
  let useToast: typeof UseToastType;
  let toast: typeof ToastType;

  // Each test gets fresh module state by resetting and re-importing
  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/hooks/use-toast');
    useToast = mod.useToast;
    toast = mod.toast;
  });

  describe('module exports', () => {
    it('should export useToast', () => {
      expect(useToast).toBeDefined();
    });

    it('should export toast', () => {
      expect(toast).toBeDefined();
    });
  });

  describe('toast function', () => {
    it('should return id, dismiss, and update functions', () => {
      const toastResult = toast({ title: 'Test' });
      expect(toastResult.id).toBeDefined();
      expect(typeof toastResult.dismiss).toBe('function');
      expect(typeof toastResult.update).toBe('function');
    });
  });

  describe('useToast hook', () => {
    it('should return initial state with empty toasts', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toEqual([]);
    });

    it('should allow calling toast()', () => {
      const { result } = renderHook(() => useToast());
      let toastResult: any;
      act(() => {
        toastResult = result.current.toast({ title: 'Test toast' });
      });
      expect(toastResult.id).toBeDefined();
    });

    it('should allow dismissing a toast', () => {
      const { result } = renderHook(() => useToast());
      let toastResult: any;
      act(() => {
        toastResult = result.current.toast({ title: 'Test toast' });
      });
      act(() => result.current.dismiss(toastResult.id));
      expect(result.current.toasts.find((t: any) => t.id === toastResult.id)?.open).toBe(false);
    });
  });

  describe('global toast function', () => {
    it('should return dismiss function that sets open to false', () => {
      const toastResult = toast({ title: 'Test' });
      expect(typeof toastResult.dismiss).toBe('function');
      act(() => toastResult.dismiss());
      // The dismiss function dispatches a DISMISS_TOAST action
      // which sets open: false on the toast
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts[0].open).toBe(false);
    });
  });
});
