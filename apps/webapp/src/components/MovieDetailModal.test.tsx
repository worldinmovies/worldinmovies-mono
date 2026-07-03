/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MovieDetailModal } from '@/components/MovieDetailModal';
import { Movie } from '@/lib/models';

const mockMovie: Movie = {
  id: 1,
  title: 'Akira',
  year: 1988,
  country: 'Japan',
  countryCode: 'jp',
  countryFlag: 'https://flagcdn.com/16x12/jp.png',
  director: 'Katsuhiro Otomo',
  rating: 8.5,
  genres: ['Animation'],
  poster: 'https://image.tmdb.org/t/p/w300/akira.jpg',
  description: 'Cyberpunk classic',
};

/** Find the "Add to Watchlist" button (not the h4 heading) */
function getWatchlistButton() {
  const all = screen.getAllByText('Add to Watchlist');
  return all.find(el => el.tagName === 'BUTTON')!;
}

/** Find the "Remove from Watchlist" button */
function getRemoveWatchlistButton() {
  return screen.getByRole('button', { name: /Remove from Watchlist/i });
}

describe('MovieDetailModal component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should show loading spinner when isLoading is true', () => {
    render(
      <MovieDetailModal
        movie={null}
        isOpen={true}
        onClose={() => {}}
        movies={[]}
        currentIndex={0}
        onNavigate={() => {}}
        isLoading={true}
      />
    );

    // Dialog renders content in a portal; use document.querySelector
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render movie details when movie is provided', () => {
    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={() => {}}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    expect(screen.getByText('Akira')).toBeInTheDocument();
    expect(screen.getByText('1988')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('Animation')).toBeInTheDocument();
    expect(screen.getByText('Cyberpunk classic')).toBeInTheDocument();
  });

  it('should render movie poster', () => {
    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={() => {}}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    const img = screen.getByAltText(/Akira poster/);
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('https://image.tmdb.org/t/p/w300/akira.jpg');
  });

  it('should mark movie as seen when toggle seen is clicked', () => {
    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={() => {}}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    const seenButton = screen.getByText('Mark as Seen');
    fireEvent.click(seenButton);

    expect(screen.getByText('Seen')).toBeInTheDocument();
    expect(localStorage.getItem('seenMovies')).toBeTruthy();
  });

  it('should remove movie from seen when already marked', () => {
    localStorage.setItem('seenMovies', JSON.stringify([mockMovie]));

    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={() => {}}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    const seenButton = screen.getByText('Seen');
    fireEvent.click(seenButton);

    expect(screen.getByText('Mark as Seen')).toBeInTheDocument();
  });

  it('should add movie to watchlist', () => {
    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={() => {}}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    const watchlistButton = getWatchlistButton();
    // Simulate a short press: mouseDown then mouseUp
    fireEvent.mouseDown(watchlistButton);
    fireEvent.mouseUp(watchlistButton);

    expect(getRemoveWatchlistButton()).toBeInTheDocument();
    expect(localStorage.getItem('watchlist')).toBeTruthy();
  });

  it('should show custom tag input on long press', () => {
    vi.useFakeTimers();

    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={() => {}}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    const watchlistButton = getWatchlistButton();
    fireEvent.mouseDown(watchlistButton);

    // Advance past the 500ms long press threshold
    act(() => {
      vi.advanceTimersByTime(510);
    });

    expect(screen.getByPlaceholderText('Enter custom tag...')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should submit custom tag', () => {
    vi.useFakeTimers();

    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={() => {}}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    // Trigger long press
    const watchlistButton = getWatchlistButton();
    fireEvent.mouseDown(watchlistButton);
    act(() => {
      vi.advanceTimersByTime(510);
    });

    const input = screen.getByPlaceholderText('Enter custom tag...');
    fireEvent.change(input, { target: { value: 'watch later' } });

    const submitButton = screen.getByText('Add');
    fireEvent.click(submitButton);

    expect(getRemoveWatchlistButton()).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should remove from watchlist', () => {
    // Pre-populate localStorage so component loads with item in watchlist
    localStorage.setItem('watchlist', JSON.stringify([{ movie: mockMovie, tag: 'watchlist' }]));

    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={() => {}}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    const removeButton = getRemoveWatchlistButton();
    fireEvent.click(removeButton);

    expect(getWatchlistButton()).toBeInTheDocument();
  });

  it('should navigate to previous movie', () => {
    const movies = [
      mockMovie,
      { ...mockMovie, id: 2, title: 'Movie 2' },
      { ...mockMovie, id: 3, title: 'Movie 3' },
    ];

    const navigateSpy = vi.fn();

    render(
      <MovieDetailModal
        movie={movies[2]}
        isOpen={true}
        onClose={() => {}}
        movies={movies}
        currentIndex={2}
        onNavigate={navigateSpy}
      />
    );

    // Radix Dialog renders content in portal; use document.querySelector
    const prevIcon = document.querySelector('.lucide-chevron-left');
    expect(prevIcon).toBeInTheDocument();
    const prevButton = prevIcon!.closest('button');
    expect(prevButton).toBeInTheDocument();
    fireEvent.click(prevButton!);

    expect(navigateSpy).toHaveBeenCalledWith('prev');
  });

  it('should navigate to next movie', () => {
    const movies = [
      mockMovie,
      { ...mockMovie, id: 2, title: 'Movie 2' },
    ];

    const navigateSpy = vi.fn();

    render(
      <MovieDetailModal
        movie={movies[0]}
        isOpen={true}
        onClose={() => {}}
        movies={movies}
        currentIndex={0}
        onNavigate={navigateSpy}
      />
    );

    const nextIcon = document.querySelector('.lucide-chevron-right');
    expect(nextIcon).toBeInTheDocument();
    const nextButton = nextIcon!.closest('button');
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton!);

    expect(navigateSpy).toHaveBeenCalledWith('next');
  });

  it('should close when onClose is called', () => {
    const closeSpy = vi.fn();

    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={closeSpy}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    // Find the X close button in the Dialog portal (sr-only "Close" text)
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should dispatch custom events when seen/watchlist changes', () => {
    const seenChangedHandler = vi.fn();
    const watchlistChangedHandler = vi.fn();

    window.addEventListener('seenMoviesChanged', seenChangedHandler as any);
    window.addEventListener('watchlistChanged', watchlistChangedHandler as any);

    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={() => {}}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    // Mark as seen
    const seenButton = screen.getByText('Mark as Seen');
    fireEvent.click(seenButton);

    expect(seenChangedHandler).toHaveBeenCalled();
    expect(localStorage.getItem('seenMovies')).toBeTruthy();

    // Add to watchlist via mouseDown + mouseUp
    const watchlistButton = getWatchlistButton();
    fireEvent.mouseDown(watchlistButton);
    fireEvent.mouseUp(watchlistButton);

    expect(watchlistChangedHandler).toHaveBeenCalled();
    expect(localStorage.getItem('watchlist')).toBeTruthy();

    window.removeEventListener('seenMoviesChanged', seenChangedHandler as any);
    window.removeEventListener('watchlistChanged', watchlistChangedHandler as any);
  });

  it('should show loading spinner when movie is null and not loading', () => {
    render(
      <MovieDetailModal
        movie={null}
        isOpen={true}
        onClose={() => {}}
        movies={[]}
        currentIndex={0}
        onNavigate={() => {}}
        isLoading={false}
      />
    );

    // When isLoading is false and movie is null, spinner is in the Dialog portal
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display director name', () => {
    render(
      <MovieDetailModal
        movie={mockMovie}
        isOpen={true}
        onClose={() => {}}
        movies={[mockMovie]}
        currentIndex={0}
        onNavigate={() => {}}
      />
    );

    expect(screen.getByText(/Katsuhiro Otomo/)).toBeInTheDocument();
  });
});
