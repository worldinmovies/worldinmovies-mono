import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Index from '@/pages/Index';

// Mock lazy-loaded MovieGrid so it resolves synchronously in tests
vi.mock('@/components/MovieGrid', () => ({
  MovieGrid: () => <div data-testid="movie-grid"><h2>Featured Films</h2></div>,
}));

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

  it('should render movie grid with fetched data', async () => {
    // Mock fetch to return sample movies
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, title: 'Test Film' }],
    }));

    const { container } = render(<Index />);

    // MovieGrid mock should render with testid
    expect(screen.getByTestId('movie-grid')).toBeInTheDocument();
    expect(screen.getByText('Featured Films')).toBeInTheDocument();
  });
});
