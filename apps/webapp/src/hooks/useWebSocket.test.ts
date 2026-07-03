/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';

// Set up config mock at top level (must be before imports)
vi.mock('@/lib/config', () => ({
  getBackendUrl: () => 'http://localhost:3000',
}));

describe('useWebSocket hook', () => {
  let mockWebSocketInstance: any;
  let wsEventHandlers: Record<string, any>;

  function triggerEvent(event: string, data?: any) {
    const handler = wsEventHandlers[event];
    if (handler) {
      handler(data ? { data } : {});
    }
  }

  beforeEach(() => {
    vi.clearAllMocks();

    wsEventHandlers = {};

    // Create a mock WebSocket instance that mimics the real API
    mockWebSocketInstance = {
      readyState: 1, // WebSocket.OPEN
      send: vi.fn(),
      close: vi.fn(),
      url: '',
    };

    // Mock the WebSocket constructor with static constants
    const MockWebSocketClass = vi.fn(function(this: any, url: string) {
      mockWebSocketInstance.url = url;
      this.readyState = 1;
      this.send = mockWebSocketInstance.send;
      this.close = mockWebSocketInstance.close;
      
      // Track event handlers for test access
      Object.defineProperty(this, 'onopen', {
        set(fn: any) { wsEventHandlers.open = fn; },
        get() { return wsEventHandlers.open; },
      });
      Object.defineProperty(this, 'onmessage', {
        set(fn: any) { wsEventHandlers.message = fn; },
        get() { return wsEventHandlers.message; },
      });
      Object.defineProperty(this, 'onclose', {
        set(fn: any) { wsEventHandlers.close = fn; },
        get() { return wsEventHandlers.close; },
      });
      Object.defineProperty(this, 'onerror', {
        set(fn: any) { wsEventHandlers.error = fn; },
        get() { return wsEventHandlers.error; },
      });
      Object.defineProperty(this, 'readyState', {
        get() { return mockWebSocketInstance.readyState; },
        set(v: number) { mockWebSocketInstance.readyState = v; },
      });
    });
    // MockWebSocketClass is constructor-typed; .OPEN/CLOSING/CLOSED not on the type
     
    (MockWebSocketClass as any).OPEN = 1;
    // MockWebSocketClass is constructor-typed; .OPEN/CLOSING/CLOSED not on the type
     
    (MockWebSocketClass as any).CLOSING = 2;
    // MockWebSocketClass is constructor-typed; .OPEN/CLOSING/CLOSED not on the type
     
    (MockWebSocketClass as any).CLOSED = 3;
    vi.stubGlobal('WebSocket', MockWebSocketClass);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('should connect to WebSocket when getBackendUrl() is set', () => {
    const { result } = renderHook(() => useWebSocket());

    // Trigger onopen
    act(() => {
      triggerEvent('open');
    });

    expect(result.current.connected).toBe(true);
  });

  it('should receive and store messages', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      triggerEvent('open');
    });

    act(() => {
      triggerEvent('message', 'Test message');
    });

    expect(result.current.messages).toContain('Test message');
  });

  it('should handle multiple messages', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      triggerEvent('open');
    });

    act(() => {
      triggerEvent('message', 'Message 1');
      triggerEvent('message', 'Message 2');
      triggerEvent('message', 'Message 3');
    });

    expect(result.current.messages.length).toBe(3);
    expect(result.current.messages).toEqual(['Message 1', 'Message 2', 'Message 3']);
  });

  it('should limit messages to last 99', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      triggerEvent('open');
    });

    // Send 101 messages
    for (let i = 0; i < 101; i++) {
      act(() => {
        triggerEvent('message', `Message ${i}`);
      });
    }

    // The hook uses prev.slice(-99) + new message = 100 total
    expect(result.current.messages.length).toBe(100);
    expect(result.current.messages[0]).toBe('Message 1');
    expect(result.current.messages[99]).toBe('Message 100');
  });

  it('should set connected to false on close', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      triggerEvent('open');
    });

    expect(result.current.connected).toBe(true);

    act(() => {
      triggerEvent('close');
    });

    expect(result.current.connected).toBe(false);
  });

  it('should send messages via sendMessage', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      triggerEvent('open');
    });

    act(() => {
      result.current.sendMessage({ action: 'test' });
    });

    expect(mockWebSocketInstance.send).toHaveBeenCalledWith(JSON.stringify({ action: 'test' }));
  });

  it('should not send if WebSocket is not open', () => {
    const { result } = renderHook(() => useWebSocket());

    // Set readyState to CLOSING after construction
    mockWebSocketInstance.readyState = 2;

    act(() => {
      result.current.sendMessage({ action: 'test' });
    });

    expect(mockWebSocketInstance.send).not.toHaveBeenCalled();
  });

  it('should clear messages via clearMessages', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      triggerEvent('open');
    });

    act(() => {
      triggerEvent('message', 'Message');
    });

    expect(result.current.messages.length).toBe(1);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it('should close WebSocket on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    act(() => {
      triggerEvent('open');
    });

    unmount();

    expect(mockWebSocketInstance.close).toHaveBeenCalled();
  });

  it('should use custom retryDelay on reconnect', () => {
    vi.useFakeTimers();

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const { result } = renderHook(() =>
      useWebSocket(undefined, { retryDelay: 50 }),
    );

    act(() => {
      triggerEvent('open');
    });

    expect(result.current.connected).toBe(true);

    act(() => {
      triggerEvent('close');
    });

    expect(result.current.connected).toBe(false);
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 50);

    setTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });
});
