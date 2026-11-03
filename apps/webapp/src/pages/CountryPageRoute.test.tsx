import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CountryPageRoute from '@/pages/CountryPageRoute';
import { useSEO } from '@/hooks/useSEO';

// ---------------------------------------------------------------------------
// Router mock — provides a fixed useParams return so the wrapper's param
// extraction can be asserted via the rendered CountryPage output.
// ---------------------------------------------------------------------------
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ countryCode: 'jp' }),
}));

vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

vi.mock('@/hooks/useMovies', () => ({
  useMovies: vi.fn(() => ({
    movies: [],
    loading: false,
    hasMore: true,
    loadMoreMovies: vi.fn(),
    loadMoviesForCountry: vi.fn(),
  })),
}));

describe('CountryPageRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts countryCode from the route params and renders CountryPage', () => {
    render(<CountryPageRoute />);
    // CountryPage with countryCode="jp" resolves to "Japan" from countrycodes.json
    expect(screen.getByText('Japan Cinema')).toBeInTheDocument();
  });

  it('renders the page for the route param value', () => {
    render(<CountryPageRoute />);
    expect(screen.getByText('Top Films from Japan')).toBeInTheDocument();
  });
});
