import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reducer, genId, toast, useToast } from '@/hooks/use-toast';
import { renderHook, act } from '@testing-library/react';

describe('use-toast hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the counter and state
    (reducer as any).__resetState__?.();
  });

  describe('genId', () => {
    it('should generate unique IDs', () => {
      const id1 = genId();
      const id2 = genId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });

    it('should generate IDs as strings', () => {
      const id = genId();
      expect(id).toMatch(/^\d+$/);
    });
  });

  describe('reducer', () => {
    const initialState = { toasts: [] };

    describe('ADD_TOAST', () => {
      it('should add a new toast to the state', () => {
        const action = { type: 'ADD_TOAST', toast: { id: '1', title: 'Test' } };
        const newState = reducer(initialState, action);
        expect(newState.toasts.length).toBe(1);
        expect(newState.toasts[0].id).toBe('1');
        expect(newState.toasts[0].title).toBe('Test');
        expect(newState.toasts[0].open).toBe(true);
      });

      it('should limit toasts to TOAST_LIMIT (1)', () => {
        const state = {
          toasts: [
            { id: '1', title: 'Existing' },
            { id: '2', title: 'Another' },
          ],
        };
        const action = { type: 'ADD_TOAST', toast: { id: '3', title: 'New' } };
        const newState = reducer(state, action);
        expect(newState.toasts.length).toBe(1);
        expect(newState.toasts[0].id).toBe('3');
      });
    });

    describe('UPDATE_TOAST', () => {
      it('should update an existing toast', () => {
        const state = {
          toasts: [{ id: '1', title: 'Old', open: true }],
        };
        const action = {
          type: 'UPDATE_TOAST',
          toast: { id: '1', title: 'New', open: false },
        };
        const newState = reducer(state, action);
        expect(newState.toasts[0].title).toBe('New');
        expect(newState.toasts[0].open).toBe(false);
      });

      it('should not affect other toasts', () => {
        const state = {
          toasts: [
            { id: '1', title: 'First' },
            { id: '2', title: 'Second' },
          ],
        };
        const action = {
          type: 'UPDATE_TOAST',
          toast: { id: '1', title: 'Updated' },
        };
        const newState = reducer(state, action);
        expect(newState.toasts[0].title).toBe('Updated');
        expect(newState.toasts[1].title).toBe('Second');
      });
    });

    describe('DISMISS_TOAST', () => {
      it('should dismiss a specific toast', () => {
        const state = {
          toasts: [
            { id: '1', title: 'First', open: true },
            { id: '2', title: 'Second', open: true },
          ],
        };
        const action = { type: 'DISMISS_TOAST', toastId: '1' };
        const newState = reducer(state, action);
        expect(newState.toasts[0].open).toBe(false);
        expect(newState.toasts[1].open).toBe(true);
      });

      it('should dismiss all toasts when no toastId provided', () => {
        const state = {
          toasts: [
            { id: '1', title: 'First', open: true },
            { id: '2', title: 'Second', open: true },
          ],
        };
        const action = { type: 'DISMISS_TOAST' };
        const newState = reducer(state, action);
        expect(newState.toasts.every((t) => t.open === false)).toBe(true);
      });
    });

    describe('REMOVE_TOAST', () => {
      it('should remove a specific toast', () => {
        const state = {
          toasts: [
            { id: '1', title: 'First' },
            { id: '2', title: 'Second' },
          ],
        };
        const action = { type: 'REMOVE_TOAST', toastId: '1' };
        const newState = reducer(state, action);
        expect(newState.toasts.length).toBe(1);
        expect(newState.toasts[0].id).toBe('2');
      });

      it('should remove all toasts when no toastId provided', () => {
        const state = {
          toasts: [
            { id: '1', title: 'First' },
            { id: '2', title: 'Second' },
          ],
        };
        const action = { type: 'REMOVE_TOAST' };
        const newState = reducer(state, action);
        expect(newState.toasts.length).toBe(0);
      });
    });
  });

  describe('useToast hook', () => {
    it('should return initial state with empty toasts', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toEqual([]);
    });

    it('should allow calling toast()', () => {
      const { result } = renderHook(() => useToast());
      const toastResult = act(() => result.current.toast({ title: 'Test toast' }));
      expect(toastResult.id).toBeDefined();
    });

    it('should allow dismissing a toast', () => {
      const { result } = renderHook(() => useToast());
      const toastResult = act(() => result.current.toast({ title: 'Test toast' }));
      act(() => result.current.dismiss(toastResult.id));
      expect(result.current.toasts.find((t) => t.id === toastResult.id)?.open).toBe(false);
    });
  });

  describe('toast function', () => {
    it('should return id, dismiss, and update functions', () => {
      const { result } = renderHook(() => useToast());
      const toastResult = act(() => result.current.toast({ title: 'Test' }));
      expect(toastResult.id).toBeDefined();
      expect(typeof toastResult.dismiss).toBe('function');
      expect(typeof toastResult.update).toBe('function');
    });

    it('should call onOpenChange when toast closes', () => {
      const onOpenChange = vi.fn();
      const { result } = renderHook(() => useToast());
      const toastResult = act(() =>
        result.current.toast({ title: 'Test', onOpenChange })
      );
      act(() => toastResult.dismiss());
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
