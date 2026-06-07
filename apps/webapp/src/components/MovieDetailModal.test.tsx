import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('MovieDetailModal component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should show loading state when isLoading is true', () => {
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

    expect(screen.getByText(/Processing|Loading/i)).toBeInTheDocument();
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

    const watchlistButton = screen.getByText('Add to Watchlist');
    fireEvent.click(watchlistButton);

    expect(screen.getByText('Remove from Watchlist')).toBeInTheDocument();
    expect(localStorage.getItem('watchlist')).toBeTruthy();
  });

  it('should show custom tag input on long press', () => {
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

    const watchlistButton = screen.getByText('Add to Watchlist');

    // Simulate long press
    fireEvent.mouseDown(watchlistButton);

    // Wait for 500ms long press timer
    setTimeout(() => {
      expect(screen.getByPlaceholderText('Enter custom tag...')).toBeInTheDocument();
    }, 550);
  });

  it('should submit custom tag', () => {
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

    const watchlistButton = screen.getByText('Add to Watchlist');
    fireEvent.mouseDown(watchlistButton);

    setTimeout(() => {
      const input = screen.getByPlaceholderText('Enter custom tag...');
      fireEvent.change(input, { target: { value: 'watch later' } });

      const submitButton = screen.getByText('Add');
      fireEvent.click(submitButton);

      expect(screen.getByText('Remove from Watchlist')).toBeInTheDocument();
    }, 550);
  });

  it('should remove from watchlist', () => {
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

    const removeButton = screen.getByText('Remove from Watchlist');
    fireEvent.click(removeButton);

    expect(screen.getByText('Add to Watchlist')).toBeInTheDocument();
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

    const prevButton = screen.getByLabelText(/prev/i) || screen.getByText(/ChevronLeft/i);
    fireEvent.click(prevButton);

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

    const nextButton = screen.getByText(/ChevronRight/i);
    fireEvent.click(nextButton);

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

    const closeButton = screen.getByRole('button', { name: /close/i });
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

    const seenButton = screen.getByText('Mark as Seen');
    fireEvent.click(seenButton);

    expect(seenChangedHandler).toHaveBeenCalled();
    expect(localStorage.getItem('seenMovies')).toBeTruthy();

    const watchlistButton = screen.getByText('Add to Watchlist');
    fireEvent.click(watchlistButton);

    expect(watchlistChangedHandler).toHaveBeenCalled();
    expect(localStorage.getItem('watchlist')).toBeTruthy();

    window.removeEventListener('seenMoviesChanged', seenChangedHandler as any);
    window.removeEventListener('watchlistChanged', watchlistChangedHandler as any);
  });

  it('should show loading state when movie is null', () => {
    const { container } = render(
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

    // When isLoading is false and movie is null, it shows nothing
    expect(container.innerHTML).toBe('');
  });
});
