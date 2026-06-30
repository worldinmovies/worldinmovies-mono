import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Admin from '@/pages/Admin';
import type { Mock } from 'vitest';

// Mock hooks used by Admin
vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(),
}));

vi.mock('@/hooks/useStatus', () => ({
  useStatus: vi.fn(),
}));

import { useWebSocket } from '@/hooks/useWebSocket';
import { useStatus } from '@/hooks/useStatus';

/** Helper: set useWebSocket return value for a test */
function setUseWebSocket(overrides: Record<string, unknown> = {}) {
  const defaults = {
    connected: false,
    messages: [],
    sendMessage: vi.fn(),
    clearMessages: vi.fn(),
  };
  (useWebSocket as Mock).mockImplementation(() => ({ ...defaults, ...overrides }));
}

/** Helper: set useStatus return value for a test */
function setUseStatus(overrides: Record<string, unknown> = {}) {
  const defaults = {
    status: undefined,
  };
  (useStatus as Mock).mockImplementation(() => ({ ...defaults, ...overrides }));
}

describe('Admin page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUseWebSocket();
    setUseStatus();
  });

  it('renders admin dashboard title', () => {
    render(<Admin />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('shows WebSocket disconnected state', () => {
    render(<Admin />);
    expect(screen.getByText('WebSocket: Disconnected')).toBeInTheDocument();
    // The indicator dot should be red when disconnected
    const statusContainer = screen.getByText('WebSocket: Disconnected').closest('div');
    expect(statusContainer?.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('shows WebSocket connected state', () => {
    setUseWebSocket({ connected: true });
    render(<Admin />);
    expect(screen.getByText('WebSocket: Connected')).toBeInTheDocument();
    const statusContainer = screen.getByText('WebSocket: Connected').closest('div');
    expect(statusContainer?.querySelector('.bg-green-500')).toBeInTheDocument();
  });

  it('renders TMDB control buttons', () => {
    render(<Admin />);
    expect(screen.getByText('Import TMDB Base')).toBeInTheDocument();
    expect(screen.getByText('Import TMDB Data')).toBeInTheDocument();
    expect(screen.getByText('Import TMDB Changes')).toBeInTheDocument();
    expect(screen.getByText('Populate Discovery Collection')).toBeInTheDocument();
    expect(screen.getByText('Reindex movie search')).toBeInTheDocument();
  });

  it('renders IMDB control buttons', () => {
    render(<Admin />);
    expect(screen.getByText('Import IMDB Ratings')).toBeInTheDocument();
    expect(screen.getByText('Import IMDB Titles')).toBeInTheDocument();
  });

  it('shows "No logs available" placeholder when log list is empty', () => {
    render(<Admin />);
    expect(screen.getByText('No logs available...')).toBeInTheDocument();
  });

  it('shows "Loading status" when status is undefined', () => {
    render(<Admin />);
    expect(screen.getByText('Loading status')).toBeInTheDocument();
  });

  it('shows import status when status data is provided', () => {
    setUseStatus({
      status: { fetched: '100', total: '200', percentageDone: 50 },
    });
    render(<Admin />);
    expect(screen.getByText(/Fetched 100 out of 200 movies which/)).toBeInTheDocument();
    expect(screen.getByText(/50\.00%/)).toBeInTheDocument();
  });

  it('renders TMDB Controls section heading', () => {
    render(<Admin />);
    expect(screen.getByText('TMDB Controls')).toBeInTheDocument();
  });

  it('renders IMDB Controls section heading', () => {
    render(<Admin />);
    expect(screen.getByText('IMDB Controls')).toBeInTheDocument();
  });

  it('renders System Logs section heading', () => {
    render(<Admin />);
    expect(screen.getByText('System Logs')).toBeInTheDocument();
  });

  it('shows log entry count', () => {
    render(<Admin />);
    expect(screen.getByText('(0 entries)')).toBeInTheDocument();
  });
});
