import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/pages/NotFound';

// Mock useSEO hook
vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

describe('NotFound page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<NotFound />);
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
  });

  it('renders home link', () => {
    render(<NotFound />);
    const homeLink = screen.getByText('Return to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('logs 404 error to console with current path', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<NotFound />);
    expect(consoleSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      '/',
    );
    consoleSpy.mockRestore();
  });
});
