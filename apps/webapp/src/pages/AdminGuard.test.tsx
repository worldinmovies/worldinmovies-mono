import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminGuard } from '@/pages/AdminGuard';

describe('AdminGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows checking authentication state on client-side navigation', () => {
    // Simulate client-side routing (e.g., back_forward navigation) by
    // overriding the performance mock to return an unrecognized type.
    vi.stubGlobal('performance', {
      now: () => 0,
      getEntriesByType: vi.fn(() => [{ type: 'back_forward' }]),
    });

    render(
      <AdminGuard>
        <div>Protected Content</div>
      </AdminGuard>,
    );

    // The component stays in checking state because it redirects instead of
    // setting isChecking(false)
    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authentication check passes (full page load)', () => {
    // Default case: navigation type is 'navigate' (full page load via nginx)
    vi.stubGlobal('performance', {
      now: () => 0,
      getEntriesByType: vi.fn(() => [{ type: 'navigate' }]),
    });

    render(
      <AdminGuard>
        <div>Protected Content</div>
      </AdminGuard>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Checking authentication...')).not.toBeInTheDocument();
  });

  it('renders children when navigation type is reload', () => {
    vi.stubGlobal('performance', {
      now: () => 0,
      getEntriesByType: vi.fn(() => [{ type: 'reload' }]),
    });

    render(
      <AdminGuard>
        <div>Protected Content</div>
      </AdminGuard>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
