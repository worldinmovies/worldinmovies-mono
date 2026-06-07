import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Index from '@/pages/Index';

describe('Index page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render HeroSection', () => {
    render(<Index />);
    expect(screen.getByText('Discover Cinema')).toBeInTheDocument();
    expect(screen.getByText('Without Borders')).toBeInTheDocument();
  });

  it('should render MovieGrid', async () => {
    // Mock the movie data fetch
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }));

    render(<Index />);

    // MovieGrid should be rendered (lazy loaded)
    expect(screen.getByText(/Featured Films/i)).toBeInTheDocument();
  });

  it('should render FAQ section for AEO', () => {
    render(<Index />);

    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText('What is World in Movies?')).toBeInTheDocument();
    expect(screen.getByText('How do I track movies I\'ve watched?')).toBeInTheDocument();
    expect(screen.getByText('Can I import my existing watchlist?')).toBeInTheDocument();
    expect(screen.getByText('What countries are represented?')).toBeInTheDocument();
  });

  it('should set correct page title via useSEO', () => {
    render(<Index />);
    expect(document.title).toBe('Home - Discover International Cinema | World in Movies');
  });

  it('should inject structured data for WebSite schema', () => {
    render(<Index />);

    const script = document.getElementById('structured-data');
    expect(script).not.toBeNull();
    const data = JSON.parse(script?.textContent || '{}');
    expect(data['@type']).toBe('WebSite');
    expect(data['potentialAction']['@type']).toBe('SearchAction');
  });

  it('should render with Suspense fallback when MovieGrid loads', async () => {
    // Make fetch never resolve to trigger Suspense
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})));

    const { container } = render(<Index />);

    // Should show loading spinner from Suspense fallback
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
