import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';

describe('useWebSocket hook', () => {
  const originalWebSocket = global.WebSocket;
  let mockWebSocket: any;
  let onOpen: (() => void) | null = null;
  let onMessage: ((e: any) => void) | null = null;
  let onClose: (() => void) | null = null;
  let onError: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWebSocket = {
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      readyState: 1, // WebSocket.OPEN
      send: vi.fn(),
      close: vi.fn(),
    };

    onOpen = null;
    onMessage = null;
    onClose = null;
    onError = null;

    vi.stubGlobal('WebSocket', class MockWebSocket {
      constructor(url: string) {
        mockWebSocket.url = url;
        mockWebSocket.onopen = onOpen;
        mockWebSocket.onmessage = onMessage;
        mockWebSocket.onclose = onClose;
        mockWebSocket.onerror = onError;
      }
      send = mockWebSocket.send;
      close = mockWebSocket.close;
      get readyState() { return mockWebSocket.readyState; }
    });

    vi.mock('@/lib/config', () => ({
      BACKEND_URL: 'http://localhost:3000',
    }));
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  it('should connect to WebSocket when BACKEND_URL is set', () => {
    const { result } = renderHook(() => useWebSocket());

    // Trigger onopen
    act(() => {
      onOpen?.();
    });

    expect(result.current.connected).toBe(true);
  });

  it('should receive and store messages', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      onOpen?.();
    });

    act(() => {
      onMessage?.({ data: 'Test message' });
    });

    expect(result.current.messages).toContain('Test message');
  });

  it('should handle multiple messages', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      onOpen?.();
    });

    act(() => {
      onMessage?.({ data: 'Message 1' });
      onMessage?.({ data: 'Message 2' });
      onMessage?.({ data: 'Message 3' });
    });

    expect(result.current.messages.length).toBe(3);
    expect(result.current.messages).toEqual(['Message 1', 'Message 2', 'Message 3']);
  });

  it('should limit messages to last 99', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      onOpen?.();
    });

    // Send 101 messages
    for (let i = 0; i < 101; i++) {
      act(() => {
        onMessage?.({ data: `Message ${i}` });
      });
    }

    expect(result.current.messages.length).toBe(99);
    expect(result.current.messages[0]).toBe('Message 2');
    expect(result.current.messages[98]).toBe('Message 100');
  });

  it('should set connected to false on close', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      onOpen?.();
    });

    expect(result.current.connected).toBe(true);

    act(() => {
      onClose?.();
    });

    expect(result.current.connected).toBe(false);
  });

  it('should send messages via sendMessage', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      onOpen?.();
    });

    act(() => {
      result.current.sendMessage({ action: 'test' });
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ action: 'test' }));
  });

  it('should not send if WebSocket is not open', () => {
    mockWebSocket.readyState = 2; // CLOSED

    const { result } = renderHook(() => useWebSocket());

    act(() => {
      onOpen?.();
    });

    act(() => {
      result.current.sendMessage({ action: 'test' });
    });

    expect(mockWebSocket.send).not.toHaveBeenCalled();
  });

  it('should clear messages via clearMessages', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      onOpen?.();
    });

    act(() => {
      onMessage?.({ data: 'Message' });
    });

    expect(result.current.messages.length).toBe(1);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it('should simulate mock messages when no BACKEND_URL', async () => {
    vi.mock('@/lib/config', () => ({
      BACKEND_URL: undefined,
    }));

    const { result } = renderHook(() => useWebSocket());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 3500)); // Wait for first mock message
    });

    expect(result.current.messages.length).toBeGreaterThan(0);
    expect(result.current.messages[0]).toContain('superduperlog');
  });

  it('should close WebSocket on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    act(() => {
      onOpen?.();
    });

    unmount();

    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});
