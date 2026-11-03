import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';
import { CountryPage } from '@/components/CountryPage';
import { useSEO } from '@/hooks/useSEO';
import { useMovies } from '@/hooks/useMovies';

// ---------------------------------------------------------------------------
// Router mock — overrides the global react-router-dom mock from setup.tsx so
// this file can assert on the target of useNavigate navigation (the global
// mock returns a no-op navigate). CountryPage uses useNavigate for both the
// back button and movie card clicks.
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ countryCode: 'jp' }),
}));

// ---------------------------------------------------------------------------
// Mock factories – declared before vi.mock so the hoisted factory captures
// them via closure (vitest hoists vi.mock() calls to the top of the module).
// ---------------------------------------------------------------------------
const mockLoadMoreMovies = vi.fn();
const mockLoadMoviesForCountry = vi.fn();

vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

vi.mock('@/hooks/useMovies', () => ({
  useMovies: vi.fn(() => ({
    movies: [],
    loading: false,
    hasMore: true,
    loadMoreMovies: mockLoadMoreMovies,
    loadMoviesForCountry: mockLoadMoviesForCountry,
  })),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockMovie1 = {
  id: 1,
  title: 'Akira',
  year: 1988,
  country: 'Japan',
  countryCode: 'JP',
  countryFlag: 'https://flagcdn.com/16x12/jp.png',
  director: 'Katsuhiro Otomo',
  rating: 8.5,
  genres: ['Animation', 'Sci-Fi'],
  poster: 'https://example.com/akira.jpg',
  description: 'A cyberpunk classic from Japan.',
};

const mockMovies = [mockMovie1];

function setUseMovies(overrides: Record<string, unknown> = {}) {
  const defaults = {
    movies: [],
    loading: false,
    hasMore: true,
    loadMoreMovies: mockLoadMoreMovies,
    loadMoviesForCountry: mockLoadMoviesForCountry,
  };
  (useMovies as Mock).mockImplementation(() => ({ ...defaults, ...overrides }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CountryPage component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUseMovies();
  });

  // ── 1. Hero section ─────────────────────────────────────────────────────
  it('renders the country name in the heading', () => {
    render(<CountryPage countryCode="jp" />);
    expect(screen.getByText('Japan Cinema')).toBeInTheDocument();
  });

  it('renders the country description', () => {
    render(<CountryPage countryCode="jp" />);
    expect(
      screen.getByText(/Discover the best films from Japan\./),
    ).toBeInTheDocument();
  });

  it('renders the flag in the hero section', () => {
    render(<CountryPage countryCode="jp" />);
    const flags = screen.getAllByAltText('Japan');
    // Hero flag (64x48) + badge flag (16x12)
    expect(flags.length).toBe(2);
    const heroFlag = flags.find((img) => img.getAttribute('width') === '64');
    expect(heroFlag).not.toBeUndefined();
    expect(heroFlag!.getAttribute('src')).toBe(
      'https://flagcdn.com/64x48/jp.png',
    );
  });

  it('falls back to the raw code for unknown country codes', () => {
    render(<CountryPage countryCode="zz" />);
    // Unknown codes fall back to the raw code (lowercase as passed)
    expect(screen.getByText('zz Cinema')).toBeInTheDocument();
  });

  // ── 2. Data loading ─────────────────────────────────────────────────────
  it('calls loadMoviesForCountry with the uppercased code on mount', () => {
    render(<CountryPage countryCode="jp" />);
    expect(mockLoadMoviesForCountry).toHaveBeenCalledWith('JP');
  });

  it('renders movies from the hook', () => {
    setUseMovies({ movies: mockMovies });
    render(<CountryPage countryCode="jp" />);
    expect(screen.getByText('Akira')).toBeInTheDocument();
    expect(screen.getByText('1988')).toBeInTheDocument();
    expect(screen.getByText('Dir. Katsuhiro Otomo')).toBeInTheDocument();
  });

  it('renders movie cards as direct div children of the grid', () => {
    setUseMovies({ movies: mockMovies });
    const { container } = render(<CountryPage countryCode="jp" />);
    const grid = container.querySelector('.grid.grid-cols-2');
    expect(grid).not.toBeNull();
    expect(
      container.querySelectorAll('.grid.grid-cols-2 > div').length,
    ).toBe(mockMovies.length);
  });

  // ── 3. Empty and loading states ─────────────────────────────────────────
  it('shows empty state when no movies and not loading', async () => {
    setUseMovies({ movies: [], loading: false });
    render(<CountryPage countryCode="jp" />);
    expect(
      screen.getByText(/No films found from Japan\./),
    ).toBeInTheDocument();
  });

  it('renders loading spinner while loading', () => {
    setUseMovies({ loading: true });
    render(<CountryPage countryCode="jp" />);
    expect(screen.getByText('Discovering more films...')).toBeInTheDocument();
  });

  // ── 4. Navigation ───────────────────────────────────────────────────────
  it('navigates back when the Back button is clicked', () => {
    render(<CountryPage countryCode="jp" />);
    const backButton = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to the movie detail route on card click', () => {
    setUseMovies({ movies: mockMovies });
    render(<CountryPage countryCode="jp" />);
    fireEvent.click(screen.getByText('Akira'));
    expect(mockNavigate).toHaveBeenCalledWith('/movie/1');
  });

  // ── 5. SEO ──────────────────────────────────────────────────────────────
  it('passes SEO metadata with WebSite + Country structured data', () => {
    render(<CountryPage countryCode="jp" />);
    expect(useSEO).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Japan Cinema – Top Films from Japan',
        canonicalUrl: 'https://worldinmovies.com/country/jp',
        structuredData: expect.objectContaining({
          '@context': 'https://schema.org',
          '@graph': expect.arrayContaining([
            expect.objectContaining({ '@type': 'WebSite' }),
            expect.objectContaining({
              '@type': 'Country',
              name: 'Japan',
            }),
          ]),
        }),
      }),
    );
  });

  it('includes the country name in the SEO description and keywords', () => {
    render(<CountryPage countryCode="jp" />);
    const call = (useSEO as Mock).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(String(call.description)).toContain('Japan');
    expect(String(call.keywords)).toContain('japan');
  });
});
