import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Mock } from 'vitest';
import DirectorPage from '@/pages/DirectorPage';
import { useSEO } from '@/hooks/useSEO';
import { useMovies } from '@/hooks/useMovies';

// ---------------------------------------------------------------------------
// Router mock - uses navigate mock from setup.tsx
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ directorName: 'Akira%20Kurosawa' }),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------
const mockLoadMoviesByDirector = vi.fn();
const mockLoadMoreMoviesByDirector = vi.fn();

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
    loadMoviesByDirector: mockLoadMoviesByDirector,
    loadMoreMoviesByDirector: mockLoadMoreMoviesByDirector,
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
  rating: 8.9,
  genres: ['Drama', 'Action'],
  poster: 'https://example.com/seven-samurai.jpg',
  description: 'A classic epic about samurai and farmers.',
};

const mockMovies = [mockMovie1];

function setUseMovies(overrides: Record<string, unknown> = {}) {
  const defaults = {
    movies: [],
    loading: false,
    hasMore: true,
    loadMoreMovies: vi.fn(),
    loadMoviesForCountry: vi.fn(),
    loadMoviesByDirector: mockLoadMoviesByDirector,
    loadMoreMoviesByDirector: mockLoadMoreMoviesByDirector,
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
    setUseMovies({ movies: mockMovies });
    render(<DirectorPage />);
    expect(screen.getByText('Akira Kurosawa')).toBeInTheDocument();
  });

  it('renders the filmography badge with movie count', () => {
    setUseMovies({ movies: mockMovies });
    render(<DirectorPage />);
    expect(screen.getByText('1 films')).toBeInTheDocument();
  });

  // ── 2. Data loading ───────────────────────────────────────────────────────
  it('calls loadMoviesByDirector with the decoded name on mount', () => {
    render(<DirectorPage />);
    expect(mockLoadMoviesByDirector).toHaveBeenCalledWith('Akira Kurosawa');
  });

  it('renders movies from the hook', () => {
    setUseMovies({ movies: mockMovies });
    render(<DirectorPage />);
    expect(screen.getByText('Seven Samurai')).toBeInTheDocument();
    expect(screen.getByText('Dir. Akira Kurosawa')).toBeInTheDocument();
  });

  // ── 3. Empty and loading states ─────────────────────────────────────────
  it('shows empty state when no movies and not loading', () => {
    setUseMovies({ movies: [], loading: false });
    render(<DirectorPage />);
    expect(
      screen.getByText(/No films found for/),
    ).toBeInTheDocument();
  });

  it('renders loading spinner while loading', () => {
    setUseMovies({ loading: true });
    render(<DirectorPage />);
    expect(screen.getByText('Discovering more films...')).toBeInTheDocument();
  });

  // ── 4. Navigation ────────────────────────────────────────────────────────
  it('navigates back when the Back button is clicked', () => {
    render(<DirectorPage />);
    const backButton = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  // ── 5. SEO ────────────────────────────────────────────────────────────────
  it('passes SEO metadata with Person structured data', () => {
    setUseMovies({ movies: mockMovies });
    render(<DirectorPage />);
    expect(useSEO).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Akira Kurosawa - Filmography',
        structuredData: expect.objectContaining({
          '@context': 'https://schema.org',
          '@graph': expect.arrayContaining([
            expect.objectContaining({
              '@type': 'Person',
              name: 'Akira Kurosawa',
            }),
          ]),
        }),
      }),
    );
  });

  it('includes director name in the SEO description', () => {
    setUseMovies({ movies: mockMovies });
    render(<DirectorPage />);
    const call = (useSEO as Mock).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(String(call.description)).toContain('Akira Kurosawa');
  });
});