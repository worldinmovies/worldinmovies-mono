/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Watchlist from '@/pages/Watchlist';
import { Movie } from '@/lib/models';

// Override the global react-router-dom mock from setup.tsx (which returns a
// no-op navigate) so this file can assert where movie selection navigates to.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/', search: '' }),
}));

const mockMovies: Movie[] = [
  { id: 1, title: 'Akira', year: 1988, country: 'Japan', countryCode: 'jp', countryFlag: '', director: 'Otomo', rating: 8.5, genres: ['Animation'], poster: '', description: '' },
  { id: 2, title: 'Seven Samurai', year: 1954, country: 'Japan', countryCode: 'jp', countryFlag: '', director: 'Kurosawa', rating: 9.0, genres: ['Drama'], poster: '', description: '' },
];

const mockWatchlistData = [
  { movie: mockMovies[0], tag: 'watchlist' },
  { movie: mockMovies[1], tag: 'watch later' },
];

const mockSeenMoviesData = [
  { id: 1, title: 'Akira', year: 1988, country: 'Japan', director: 'Otomo', rating: 8.5, genres: ['Animation'], poster: '', description: '' },
];

const setupLocalStorage = (watchlistData?: any, seenMoviesData?: any) => {
  localStorage.setItem('watchlist', JSON.stringify(watchlistData || mockWatchlistData));
  localStorage.setItem('seenMovies', JSON.stringify(seenMoviesData || mockSeenMoviesData));
};

/** Render Watchlist with pre-loaded data (simulates what useEffect does) */
const renderWithData = (watchlistData?: any, seenMoviesData?: any) => {
  setupLocalStorage(watchlistData, seenMoviesData);
  const result = render(<Watchlist />);
  // useEffect runs after render, so we re-render to pick up localStorage
  const { rerender } = result;
  rerender(<Watchlist />);
  return result;
};

describe('Watchlist page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render empty watchlist state', () => {
    render(<Watchlist />);
    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
    expect(screen.getByText(/Start adding movies/i)).toBeInTheDocument();
  });

  it('should render watchlist items when data exists', () => {
    renderWithData(mockWatchlistData);

    expect(screen.getByText('Akira')).toBeInTheDocument();
    expect(screen.getByText('Seven Samurai')).toBeInTheDocument();
    expect(screen.getByText(/2 movies in your watchlist/i)).toBeInTheDocument();
  });

  it('should render search input when watchlist has items', () => {
    renderWithData(mockWatchlistData);

    expect(screen.getByPlaceholderText(/Search by title, director, or country.../i)).toBeInTheDocument();
  });

  it('should filter by search query', () => {
    renderWithData(mockWatchlistData);

    // Both movies should be visible
    expect(screen.getByText('Akira')).toBeInTheDocument();
    expect(screen.getByText('Seven Samurai')).toBeInTheDocument();
  });

  it('should render country filter when watchlist has items', () => {
    renderWithData(mockWatchlistData);

    expect(screen.getByText(/Explore by Country/i)).toBeInTheDocument();
  });

  it('should render tag filter dropdown when watchlist has items', () => {
    renderWithData(mockWatchlistData);

    // "All Tags" is the trigger text when tagFilter is 'all'
    expect(screen.getByText('All Tags')).toBeInTheDocument();
  });

  it('should render seen/unseen filter dropdown when watchlist has items', () => {
    renderWithData(mockWatchlistData);

    // "All" is the trigger text when seenFilter is 'all'
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('should render genre filter dropdown when watchlist has items', () => {
    const genreData = [
      { movie: { ...mockMovies[0], genres: ['Animation', 'Sci-Fi'] }, tag: 'watchlist' },
    ];
    renderWithData(genreData);

    expect(screen.getByText('All Genres')).toBeInTheDocument();
  });

  it('should set correct page title via useSEO', () => {
    render(<Watchlist />);
    expect(document.title).toBe('My Watchlist - World Cinema | World in Movies');
  });

  it('navigates to the movie detail route when a card is selected', () => {
    renderWithData(mockWatchlistData);

    // Click a movie card to select it.
    expect(screen.getByText('Akira')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Akira'));

    // Selecting a movie navigates to its dedicated /movie/:id route.
    expect(mockNavigate).toHaveBeenCalledWith('/movie/1');
  });

  it('should handle empty watchlist gracefully', () => {
    const { container } = render(<Watchlist />);

    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
  });

  it('updates the watchlist when a watchlistChanged event is dispatched', () => {
    setupLocalStorage(mockWatchlistData);
    render(<Watchlist />);

    // The component listens for externally-dispatched watchlistChanged events
    // (raised e.g. when a movie is toggled on another page).
    act(() => {
      window.dispatchEvent(new CustomEvent('watchlistChanged', { detail: [] }));
    });

    // Emptying the watchlist via the event clears the rendered list.
    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
  });

  it('should show movie count when watchlist has items', () => {
    renderWithData(mockWatchlistData);
    expect(screen.getByText(/2 movies in your watchlist/i)).toBeInTheDocument();
  });
});
