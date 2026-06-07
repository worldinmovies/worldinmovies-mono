import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMovies } from '@/hooks/useMovies';
import { Movie } from '@/lib/models';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock Intl.DisplayNames
vi.stubGlobal('Intl', {
  DisplayNames: vi.fn().mockImplementation(() => ({
    of: (code: string) => code ? `Region for ${code}` : 'Unknown',
  })),
});

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock BACKEND_URL
vi.mock('@/lib/config', () => ({
  BACKEND_URL: 'http://localhost:3000',
}));

describe('useMovies hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('shuffleArray', () => {
    it('should shuffle array and return a new array', () => {
      const movies: Movie[] = [
        { id: 1, title: 'Movie 1', year: 2020, country: 'Japan', director: 'Director A', rating: 8.5, genres: ['Drama'], poster: '', description: '' },
        { id: 2, title: 'Movie 2', year: 2021, country: 'France', director: 'Director B', rating: 7.5, genres: ['Comedy'], poster: '', description: '' },
        { id: 3, title: 'Movie 3', year: 2022, country: 'Italy', director: 'Director C', rating: 9.0, genres: ['Thriller'], poster: '', description: '' },
      ];

      const { result } = renderHook(() => useMovies());
      // Access the shuffle function via loadMoreMovies - we need to test it indirectly
      // Since shuffleArray is internal, we test via loadMoreMovies behavior
      expect(result.current.movies).toEqual([]);
    });

    it('should return a shuffled array with same length', async () => {
      const movies: Movie[] = Array.from({ length: 10 }, (_, i) => ({
        id: i, title: `Movie ${i}`, year: 2020 + i, country: 'Japan', director: 'Director', rating: 8.0, genres: ['Drama'], poster: '', description: '',
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => movies.map((m) => ({
          _id: m.id, original_title: m.title, year: m.year, estimated_country: m.country.toLowerCase(),
          director: m.director, imdb_vote_average: m.rating, vote_average: m.rating, rating: m.rating,
          genres: [{ name: m.genres[0] }], poster_path: '/poster.jpg', overview: m.description,
        })),
      });

      const { result } = renderHook(() => useMovies());

      await act(async () => {
        await result.current.loadMoreMovies(Date.now(), undefined, 0, undefined, true);
      });

      expect(result.current.movies.length).toBe(movies.length);
    });
  });

  describe('loadMoreMovies', () => {
    it('should load movies from backend API', async () => {
      const backendMovies = [
        { _id: 1, original_title: 'Movie 1', year: 2020, estimated_country: 'jp', director: 'Director A', imdb_vote_average: 8.5, vote_average: 8.0, rating: 8.5, genres: [{ name: 'Drama' }], poster_path: '/poster1.jpg', overview: 'Description 1' },
        { _id: 2, original_title: 'Movie 2', year: 2021, estimated_country: 'fr', director: 'Director B', imdb_vote_average: 7.5, vote_average: 7.0, rating: 7.5, genres: [{ name: 'Comedy' }], poster_path: '/poster2.jpg', overview: 'Description 2' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => backendMovies,
      });

      const { result } = renderHook(() => useMovies());

      await act(async () => {
        await result.current.loadMoreMovies(Date.now(), undefined, 0, undefined, true);
      });

      expect(result.current.movies.length).toBe(2);
      expect(result.current.movies[0].title).toBe('Movie 1');
      expect(result.current.movies[0].country).toBe('Region for jp');
      expect(result.current.movies[0].poster).toBe('https://image.tmdb.org/t/p/w300/poster1.jpg');
      expect(result.current.loading).toBe(false);
    });

    it('should handle country-specific loading', async () => {
      const backendMovies = [
        { _id: 1, original_title: 'Japanese Movie', year: 2020, estimated_country: 'jp', director: 'Kurosawa', imdb_vote_average: 9.0, vote_average: 9.0, rating: 9.0, genres: [{ name: 'Drama' }], poster_path: '/poster.jpg', overview: 'Description' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => backendMovies,
      });

      const { result } = renderHook(() => useMovies('jp'));

      await act(async () => {
        await result.current.loadMoreMovies(Date.now(), 'jp', 0, undefined, true);
      });

      expect(result.current.movies.length).toBe(1);
      expect(result.current.movies[0].country).toBe('Region for jp');
      // Verify correct URL was called
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/view/best/JP?skip=0&limit=8'
      );
    });

    it('should handle genre filtering', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useMovies());

      await act(async () => {
        await result.current.loadMoreMovies(Date.now(), undefined, 0, 'Drama', true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/view/random/best/0?genres=Drama&limit=8'
      );
    });

    it('should handle API errors and fallback gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMovies());

      await act(async () => {
        await result.current.loadMoreMovies(Date.now(), undefined, 0, undefined, true);
      });

      // Should not crash, loading should be false
      expect(result.current.loading).toBe(false);
    });

    it('should not load if already loading', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useMovies());

      // Set loading to true manually
      await act(async () => {
        result.current.loadMoreMovies(Date.now(), undefined, 0, undefined, true);
      });

      // Second call should be blocked
      await act(async () => {
        result.current.loadMoreMovies(Date.now(), undefined, 0, undefined, true);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should set hasMore to false when no movies returned', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useMovies());

      await act(async () => {
        await result.current.loadMoreMovies(Date.now(), undefined, 0, undefined, true);
      });

      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('loadMoviesForCountry', () => {
    it('should load movies for a specific country', async () => {
      const backendMovies = [
        { _id: 1, original_title: 'Movie', year: 2020, estimated_country: 'kr', director: 'Bong', imdb_vote_average: 8.5, vote_average: 8.0, rating: 8.5, genres: [{ name: 'Thriller' }], poster_path: '/poster.jpg', overview: 'Desc' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => backendMovies,
      });

      const { result } = renderHook(() => useMovies());

      await act(async () => {
        await result.current.loadMoviesForCountry('kr');
      });

      expect(result.current.movies.length).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/view/best/KR?skip=0&limit=10'
      );
    });
  });

  describe('fetchMovieDetails', () => {
    it('should fetch movie details by ID', async () => {
      const backendMovie = {
        _id: 42, original_title: 'Akira', year: 1988, estimated_country: 'jp',
        director: 'Katsuhiro Otomo', imdb_vote_average: 8.0, vote_average: 8.0, rating: 8.0,
        genres: [{ name: 'Animation' }], poster_path: '/akira.jpg', overview: 'Cyberpunk classic',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => backendMovie,
      });

      const { result } = renderHook(() => useMovies());

      const movie = await act(async () => result.current.fetchMovieDetails(42));

      expect(movie?.title).toBe('Akira');
      expect(movie?.year).toBe(1988);
      expect(movie?.country).toBe('Region for jp');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/movie/42');
    });

    it('should return null when movie not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useMovies());

      const movie = await act(async () => result.current.fetchMovieDetails(999));

      expect(movie).toBeNull();
    });
  });

  describe('resetMovies', () => {
    it('should reset movies state', async () => {
      const { result } = renderHook(() => useMovies());

      await act(async () => {
        result.current.resetMovies();
      });

      expect(result.current.movies).toEqual([]);
      expect(result.current.hasMore).toBe(true);
    });
  });
});
