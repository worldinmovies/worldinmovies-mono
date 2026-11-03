import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';
import { DirectorPage } from '@/pages/DirectorPage';
import { useSEO } from '@/hooks/useSEO';
import { useMovies } from '@/hooks/useMovies';

// ---------------------------------------------------------------------------
// Router mock — overrides the global react-router-dom mock from setup.tsx so
// this file can assert on the target of useNavigate navigation.
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ directorName: 'Akira%20Kurosawa' }),
}));

// ---------------------------------------------------------------------------
// Mock factories – declared before vi.mock so the hoisted factory captures
// them via closure (vitest hoists vi.mock() calls to the top of the module).
// ---------------------------------------------------------------------------
const mockLoadMoreMovies = vi.fn();
const mockLoadMoviesByDirector = vi.fn();

vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

vi.mock('@/hooks/useMovies', () => ({
  useMovies: vi.fn(() => ({
    movies: [],
    loading: false,
    hasMore: true,
    loadMoreMovies: mockLoadMoreMovies,
    loadMoviesByDirector: mockLoadMoviesByDirector,
  })),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockMovie1 = {
  id: 1,
  title: 'Seven Samurai',
  year: 1954,
  country: 'Japan',
  countryCode: 'JP',
  countryFlag: 'https://flagcdn.com/16x12/jp.png',
  director: 'Akira Kurosawa',
  rating: 8.5,
  genres: ['Action', 'Drama'],
  poster: 'https://example.com/seven-samurai.jpg',
  description: 'A epic about samurai.',
};

const mockMovies = [mockMovie1];

function setUseMovies(overrides: Record<string, unknown> = {}) {
  const defaults = {
    movies: [],
    loading: false,
    hasMore: true,
    loadMoreMovies: mockLoadMoreMovies,
    loadMoviesByDirector: mockLoadMoviesByDirector,
  };
  (useMovies as Mock).mockImplementation(() => ({ ...defaults, ...overrides }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('DirectorPage component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUseMovies();
  });

  // ── 1. Hero section ─────────────────────────────────────────────────────
  it('renders the director name in the heading', () => {
    render(<DirectorPage />);
    expect(screen.getByRole('heading', { name: 'Akira Kurosawa' })).toBeInTheDocument();
  });

  it('decodes URL-encoded director names', () => {
    render(<DirectorPage />);
    expect(screen.getByText('Films by Akira Kurosawa')).toBeInTheDocument();
  });

  it('renders the director description', () => {
    render(<DirectorPage />);
    expect(
      screen.getByText(/Explore all films directed by Akira Kurosawa\./),
    ).toBeInTheDocument();
  });

  // ── 2. Data loading ─────────────────────────────────────────────────────
  it('calls loadMoviesByDirector with the decoded name on mount', () => {
    render(<DirectorPage />);
    expect(mockLoadMoviesByDirector).toHaveBeenCalledWith('Akira Kurosawa');
  });

  it('renders movies from the hook', () => {
    setUseMovies({ movies: mockMovies });
    render(<DirectorPage />);
    expect(screen.getByText('Seven Samurai')).toBeInTheDocument();
    expect(screen.getByText('1954')).toBeInTheDocument();
  });

  // ── 3. Empty and loading states ─────────────────────────────────────────
  it('shows empty state when no movies and not loading', async () => {
    setUseMovies({ movies: [], loading: false });
    render(<DirectorPage />);
    expect(
      screen.getByText(/No films found from Akira Kurosawa\./),
    ).toBeInTheDocument();
  });

  it('renders loading spinner while loading', () => {
    setUseMovies({ loading: true });
    render(<DirectorPage />);
    expect(screen.getByText('Discovering more films...')).toBeInTheDocument();
  });

  // ── 4. Navigation ───────────────────────────────────────────────────────
  it('navigates back when the Back button is clicked', () => {
    render(<DirectorPage />);
    const backButton = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to the movie detail route on card click', () => {
    setUseMovies({ movies: mockMovies });
    render(<DirectorPage />);
    fireEvent.click(screen.getByText('Seven Samurai'));
    expect(mockNavigate).toHaveBeenCalledWith('/movie/1');
  });

  // ── 5. SEO ──────────────────────────────────────────────────────────────
  it('passes SEO metadata with Person structured data', () => {
    render(<DirectorPage />);
    expect(useSEO).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Akira Kurosawa – Director Filmography',
        structuredData: expect.objectContaining({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'Akira Kurosawa',
        }),
      }),
    );
  });

  it('includes the director name in the SEO description and keywords', () => {
    render(<DirectorPage />);
    const call = (useSEO as Mock).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(String(call.description)).toContain('Akira Kurosawa');
    expect(String(call.keywords)).toContain('akira kurosawa');
  });
});