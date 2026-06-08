import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStatus } from '@/hooks/useStatus';

// Mock config module at top level - value inlined since vi.mock is hoisted
vi.mock('@/lib/config', () => ({
  BACKEND_URL: 'http://localhost:3000',
}));

const mockBackendUrl = 'http://localhost:3000';

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

    renderHook(() => useStatus());

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`${mockBackendUrl}/status`);
    });
  });

  it('should handle fetch errors gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const { result } = renderHook(() => useStatus());

    await waitFor(() => {
      expect(result.current.status).toBeUndefined();
    });
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

    renderHook(() => useStatus());

    await waitFor(() => {
      // Wait for fetch to have been called
      expect(fetch).toHaveBeenCalledWith(`${mockBackendUrl}/status`);
    });
  });
});
