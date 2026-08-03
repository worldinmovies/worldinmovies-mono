import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovieGrid } from './MovieGrid';
import type { Mock } from 'vitest';

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

    render(<MovieGrid />);

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

    render(<MovieGrid />);

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

    const { container } = render(<MovieGrid />);

    const grid = container.querySelector('.grid.grid-cols-2');
    expect(grid).not.toBeNull();
    const matchedByE2eSelector = container.querySelectorAll('.grid.grid-cols-2 > div');
    expect(matchedByE2eSelector.length).toBe(mockMovies.length);
  });

  // ── 3. loadMoreMovies called on mount ──────────────────────────────────
  it('calls loadMoreMovies on mount', () => {
    render(<MovieGrid />);

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
    render(<MovieGrid />);

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

    render(<MovieGrid />);

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

  // ── 6. Click movie opens detail modal ──────────────────────────────────
  it('opens movie detail modal on click', async () => {
    mockFetchMovieDetails.mockResolvedValue(mockMovie1);
    setUseMovies({ movies: mockMovies });

    render(<MovieGrid />);

    // MovieCard renders the title inside a Card whose onClick calls
    // handleMovieSelect(movie.id).  Click the title to trigger it.
    fireEvent.click(screen.getByText('Test Movie 1'));

    // handleMovieSelect calls fetchMovieDetails(1)
    expect(mockFetchMovieDetails).toHaveBeenCalledWith(1);
  });

  // ── 7. Empty state ─────────────────────────────────────────────────────
  it('shows empty state when no movies match filter', async () => {
    render(<MovieGrid />);

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

  // ── (Bonus) Modal navigation through filtered list ─────────────────────
  it('navigates between movies in the detail modal', async () => {
    // Provide two movies and resolve detail fetching.
    mockFetchMovieDetails.mockResolvedValue(mockMovie1);
    setUseMovies({ movies: mockMovies });

    render(<MovieGrid />);

    // Open the modal for the first movie.
    fireEvent.click(screen.getByText('Test Movie 1'));
    await waitFor(() => {
      expect(mockFetchMovieDetails).toHaveBeenCalledWith(1);
    });

    // The modal is now open (Radix Dialog in a portal).  With 2 movies and
    // current index 0, a "next" button (ChevronRight icon) should be present.
    // Radix renders the navigation buttons without accessible labels, so we
    // locate them via their SVG icons.
    const modal = document.querySelector('[role="dialog"]');
    expect(modal).toBeInTheDocument();

    // The next-button icon (ChevronRight) should be in the dialog.
    const nextButton = modal?.querySelector('.lucide-chevron-right')?.closest('button');
    expect(nextButton).toBeInTheDocument();

    // Click next to navigate to the second movie.
    if (nextButton) fireEvent.click(nextButton);

    // After navigation selectedMovie switches to mockMovie2.
    // The dialog now renders the second movie's title as a DialogTitle.
    // The grid also shows the card – verify the dialog-specific h2 is present.
    await waitFor(() => {
      const dialogTitle = modal?.querySelector('h2');
      expect(dialogTitle).toHaveTextContent('Test Movie 2');
    });
  });
});
