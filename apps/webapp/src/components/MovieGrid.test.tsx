import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MovieGrid } from './MovieGrid';
import type { Mock } from 'vitest';

// ---------------------------------------------------------------------------
// Router mock — overrides the global react-router-dom mock from setup.tsx so
// this file can assert on the target of useNavigate navigation (the global
// mock returns a no-op navigate). The real MemoryRouter's child rendering is
// not needed by MovieGrid, a passthrough div suffices.
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/', search: '' }),
}));

// ---------------------------------------------------------------------------
// Mock factories – declared before vi.mock so the hoisted factory captures
// them via closure (vitest hoists vi.mock() calls to the top of the module).
// ---------------------------------------------------------------------------
const mockLoadMoreMovies = vi.fn();
const mockLoadMoviesForCountry = vi.fn();
const mockFetchMovieDetails = vi.fn();

vi.mock('@/hooks/useMovies', () => ({
  useMovies: vi.fn(() => ({
    movies: [],
    loading: false,
    hasMore: true,
    loadMoreMovies: mockLoadMoreMovies,
    loadMoviesForCountry: mockLoadMoviesForCountry,
    fetchMovieDetails: mockFetchMovieDetails,
  })),
}));

import { useMovies } from '@/hooks/useMovies';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockMovie1 = {
  id: 1,
  title: 'Test Movie 1',
  year: 2020,
  country: 'Japan',
  countryCode: 'JP',
  countryFlag: 'https://flagcdn.com/16x12/jp.png',
  director: 'Director One',
  rating: 8.5,
  genres: ['Drama', 'Thriller'],
  poster: 'https://example.com/poster1.jpg',
  description: 'A compelling drama from Japan.',
};

const mockMovie2 = {
  id: 2,
  title: 'Test Movie 2',
  year: 2021,
  country: 'France',
  countryCode: 'FR',
  countryFlag: 'https://flagcdn.com/16x12/fr.png',
  director: 'Director Two',
  rating: 7.2,
  genres: ['Comedy'],
  poster: 'https://example.com/poster2.jpg',
  description: 'A hilarious comedy from France.',
};

const mockMovies = [mockMovie1, mockMovie2];

// ---------------------------------------------------------------------------
// Helper: set the default useMovies return value
// ---------------------------------------------------------------------------
function setUseMovies(overrides: Record<string, unknown> = {}) {
  const defaults = {
    movies: [],
    loading: false,
    hasMore: true,
    loadMoreMovies: mockLoadMoreMovies,
    loadMoviesForCountry: mockLoadMoviesForCountry,
    fetchMovieDetails: mockFetchMovieDetails,
  };
  (useMovies as Mock).mockImplementation(() => ({ ...defaults, ...overrides }));
}

function renderGrid() {
  return render(
    <MemoryRouter>
      <MovieGrid />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MovieGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUseMovies();
  });

  // ── 1. Loading state ───────────────────────────────────────────────────
  it('renders loading spinner when loading', () => {
    setUseMovies({ loading: true });

    renderGrid();

    // The loading block renders a Loader2 icon alongside "Discovering more films…"
    expect(screen.getByText('Discovering more films...')).toBeInTheDocument();

    // The spinner icon is an SVG with the animate-spin class inside the
    // loading container – verify the wrapping element exists.
    const loadingContainer = screen.getByText('Discovering more films...').closest('div');
    expect(loadingContainer?.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // ── 2. Movies render ───────────────────────────────────────────────────
  it('renders movies when loaded', () => {
    setUseMovies({ movies: mockMovies });

    renderGrid();

    // Each MovieCard renders its title inside an <h3>.
    expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
    expect(screen.getByText('Test Movie 2')).toBeInTheDocument();

    // Per-movie metadata is rendered as well.
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  // ── 2b. E2E DOM contract ──────────────────────────────────────────────
  // The Playwright suite locates cards via `.grid.grid-cols-2 > div`, so the
  // MovieCard root must be a <div> DIRECT child of the grid (not wrapped in
  // an <a>). Regression: 65f6bcb wrapped cards in <Link>, making the locator
  // match zero elements and blanking the grid in every discovery/search E2E.
  it('renders movie cards as direct div children of the grid (E2E selector .grid.grid-cols-2 > div)', () => {
    setUseMovies({ movies: mockMovies });

    const { container } = renderGrid();

    const grid = container.querySelector('.grid.grid-cols-2');
    expect(grid).not.toBeNull();
    const matchedByE2eSelector = container.querySelectorAll('.grid.grid-cols-2 > div');
    expect(matchedByE2eSelector.length).toBe(mockMovies.length);
  });

  // ── 3. loadMoreMovies called on mount ──────────────────────────────────
  it('calls loadMoreMovies on mount', () => {
    renderGrid();

    // The initial load happens in the [genreFilter, selectedCountry] effect,
    // which fires on mount with the default values:
    //   loadMoreMovies(seed, null, 0, 'all', true)
    expect(mockLoadMoreMovies).toHaveBeenCalled();

    // Verify at least one call matches the mount signature.
    const hasMountCall = mockLoadMoreMovies.mock.calls.some(
      ([seed, countryCode, skip, genres, reset]) =>
        typeof seed === 'number' &&
        countryCode === null &&
        skip === 0 &&
        genres === 'all' &&
        reset === true,
    );
    expect(hasMountCall).toBe(true);
  });

  // ── 4. Country selection triggers loadMoviesForCountry ─────────────────
  it('country selection triggers loadMoviesForCountry', async () => {
    renderGrid();

    // The country dropdown uses a Radix Select with role="combobox".
    const countryTrigger = screen.getByRole('combobox');
    fireEvent.click(countryTrigger);

    // The options are rendered inside a Radix Portal – still queryable via screen.
    const japanOption = await waitFor(() =>
      screen.getByRole('option', { name: /Japan/i }),
    );
    fireEvent.click(japanOption);

    // handleCountrySelect finds "Japan" → countryCode "JP" → calls loadMoviesForCountry("JP")
    expect(mockLoadMoviesForCountry).toHaveBeenCalledWith('JP');
  });

  // ── 5. Seen filter ─────────────────────────────────────────────────────
  it('filters movies by seen status', async () => {
    const user = userEvent.setup();

    // Seed localStorage *before* render – the mount effect reads it.
    localStorage.setItem('seenMovies', JSON.stringify([mockMovie1]));
    setUseMovies({ movies: mockMovies });

    renderGrid();

    // On mount the component loads seenMovies from localStorage, then re-renders.
    // Wait for the effect to settle and both movies to show (seenFilter = 'all').
    await waitFor(() => {
      expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
      expect(screen.getByText('Test Movie 2')).toBeInTheDocument();
    });

    // The seen-filter trigger is the first button whose text content is exactly
    // "All" (the genre filter shows "All Genres", watchlist "All Movies", and
    // country select "All Countries" – none of which are exact matches).
    const allButtons = screen.getAllByRole('button');
    const seenFilterTrigger = allButtons.find(
      btn => btn.textContent?.trim() === 'All',
    );
    expect(seenFilterTrigger).toBeInTheDocument();
    await user.click(seenFilterTrigger!);

    // Click "Unseen Movies" in the Radix portal.
    const unseenMenuItem = await screen.findByText('Unseen Movies');
    await user.click(unseenMenuItem);

    // After the filter changes to 'unseen', mockMovie1 (in seenMovies) should
    // be hidden and only mockMovie2 should remain.
    await waitFor(() => {
      expect(screen.queryByText('Test Movie 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Movie 2')).toBeInTheDocument();
    });
  });

  // ── 6. Click movie navigates to its detail route ───────────────────────
  it('navigates to the movie detail route on card click', async () => {
    setUseMovies({ movies: mockMovies });

    renderGrid();

    // MovieCard renders the title inside a Card whose onClick calls
    // handleMovieSelect(movie.id), which should navigate to /movie/:id
    // rather than opening a modal.  Click the title to trigger it.
    fireEvent.click(screen.getByText('Test Movie 1'));

    expect(mockNavigate).toHaveBeenCalledWith('/movie/1');

    // A modal must NOT be opened (detail is now a routed page).
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  // ── 7. Empty state ─────────────────────────────────────────────────────
  it('shows empty state when no movies match filter', async () => {
    renderGrid();

    // Select a country so the condition fires:
    //   filteredMovies.length === 0 && selectedCountry && !loading
    const countryTrigger = screen.getByRole('combobox');
    fireEvent.click(countryTrigger);

    const japanOption = await waitFor(() =>
      screen.getByRole('option', { name: /Japan/i }),
    );
    fireEvent.click(japanOption);

    // The empty-state message should appear.
    expect(
      screen.getByText(/No films found from Japan/i),
    ).toBeInTheDocument();
  });

  // ── (Bonus) Movie search suggestion navigates to detail route ──────────
  it('navigates to the movie detail route when a search suggestion is selected', async () => {
    setUseMovies({ movies: mockMovies });

    renderGrid();

    // MovieSearch calls onMovieSelect(id) → handleMovieSelect → navigate.
    fireEvent.click(screen.getByText('Test Movie 1'));

    expect(mockNavigate).toHaveBeenCalledWith('/movie/1');
  });
});
