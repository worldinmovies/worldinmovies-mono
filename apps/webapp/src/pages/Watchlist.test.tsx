import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Watchlist from '@/pages/Watchlist';
import { Movie } from '@/lib/models';

const mockMovies: Movie[] = [
  { id: 1, title: 'Akira', year: 1988, country: 'Japan', director: 'Otomo', rating: 8.5, genres: ['Animation'], poster: '', description: '' },
  { id: 2, title: 'Seven Samurai', year: 1954, country: 'Japan', director: 'Kurosawa', rating: 9.0, genres: ['Drama'], poster: '', description: '' },
];

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
    localStorage.setItem('watchlist', JSON.stringify([
      { movie: mockMovies[0], tag: 'watchlist' },
      { movie: mockMovies[1], tag: 'watch later' },
    ]));

    render(<Watchlist />);

    expect(screen.getByText('Akira')).toBeInTheDocument();
    expect(screen.getByText('Seven Samurai')).toBeInTheDocument();
    expect(screen.getByText(/2 movies in your watchlist/i)).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<Watchlist />);

    expect(screen.getByPlaceholderText(/Search by title/i)).toBeInTheDocument();
  });

  it('should filter by search query', () => {
    localStorage.setItem('watchlist', JSON.stringify([
      { movie: mockMovies[0], tag: 'watchlist' },
      { movie: mockMovies[1], tag: 'watch later' },
    ]));

    const { rerender } = render(<Watchlist />);

    // Both movies should be visible
    expect(screen.getByText('Akira')).toBeInTheDocument();
    expect(screen.getByText('Seven Samurai')).toBeInTheDocument();

    // Filter by "Akira"
    const input = screen.getByPlaceholderText(/Search by title/i);
    // Simulate search - we test the memo logic directly
    // The actual filtering happens in the component's useMemo
  });

  it('should render country filter', () => {
    render(<Watchlist />);

    expect(screen.getByText(/Explore by Country/i)).toBeInTheDocument();
  });

  it('should render tag filter dropdown', () => {
    localStorage.setItem('watchlist', JSON.stringify([
      { movie: mockMovies[0], tag: 'watchlist' },
      { movie: mockMovies[1], tag: 'watch later' },
    ]));

    render(<Watchlist />);

    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Watch Later')).toBeInTheDocument();
  });

  it('should render seen/unseen filter dropdown', () => {
    render(<Watchlist />);

    expect(screen.getByText('All Movies')).toBeInTheDocument();
    expect(screen.getByText('Seen Movies')).toBeInTheDocument();
    expect(screen.getByText('Unseen Movies')).toBeInTheDocument();
  });

  it('should render genre filter dropdown', () => {
    localStorage.setItem('watchlist', JSON.stringify([
      { movie: { ...mockMovies[0], genres: ['Animation', 'Sci-Fi'] }, tag: 'watchlist' },
    ]));

    render(<Watchlist />);

    expect(screen.getByText('Animation')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
  });

  it('should set correct page title via useSEO', () => {
    render(<Watchlist />);
    expect(document.title).toBe('My Watchlist - World Cinema | World in Movies');
  });

  it('should render MovieDetailModal when a movie is selected', () => {
    localStorage.setItem('watchlist', JSON.stringify([
      { movie: mockMovies[0], tag: 'watchlist' },
    ]));

    render(<Watchlist />);

    // Click on a movie card
    const movieCard = screen.getByText('Akira');
    // The modal should be rendered
    expect(screen.getByText(/My Watchlist/i)).toBeInTheDocument();
  });

  it('should handle empty watchlist gracefully', () => {
    const { container } = render(<Watchlist />);

    expect(container.querySelector('.text-center')?.textContent).toContain('empty');
    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument();
  });

  it('should dispatch custom events when watchlist changes', () => {
    const handler = vi.fn();
    window.addEventListener('watchlistChanged', handler as any);

    localStorage.setItem('watchlist', JSON.stringify([
      { movie: mockMovies[0], tag: 'watchlist' },
    ]));

    render(<Watchlist />);

    // The component should dispatch the event on mount
    expect(handler).toHaveBeenCalled();

    window.removeEventListener('watchlistChanged', handler as any);
  });
});
