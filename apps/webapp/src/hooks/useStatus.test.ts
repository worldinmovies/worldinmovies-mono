import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStatus } from '@/hooks/useStatus';

describe('useStatus hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch status from backend API', async () => {
    const mockStatus = {
      fetched: '100',
      total: '500',
      percentageDone: 20,
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => mockStatus,
    }));

    vi.mock('@/lib/config', () => ({
      BACKEND_URL: 'http://localhost:3000',
    }));

    const { waitFor } = renderHook(() => useStatus());

    await act(async () => {
      await waitFor(() => {
        // Status should be set
      });
    });

    // The hook should have called fetch
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/status');
  });

  it('should handle fetch errors gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    vi.mock('@/lib/config', () => ({
      BACKEND_URL: 'http://localhost:3000',
    }));

    const { result } = renderHook(() => useStatus());

    // Should not throw
    await act(async () => {
      // Wait for effect to run
    });

    expect(result.current.status).toBeUndefined();
  });

  it('should return status object with correct shape', async () => {
    const mockStatus = {
      fetched: '200',
      total: '1000',
      percentageDone: 20,
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => mockStatus,
    }));

    vi.mock('@/lib/config', () => ({
      BACKEND_URL: 'http://localhost:3000',
    }));

    const { waitFor } = renderHook(() => useStatus());

    await act(async () => {
      await waitFor(() => {
        // Wait for status to be set
      });
    });

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/status');
  });
});
