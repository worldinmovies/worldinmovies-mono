import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMovies } from '@/hooks/useMovies';
import { Movie } from '@/lib/models';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

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

// Mock getBackendUrl
vi.mock('@/lib/config', () => ({
  getBackendUrl: () => 'http://localhost:3000',
}));

describe('useMovies hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('initial state', () => {
    it('should start with empty movies array', () => {
      const { result } = renderHook(() => useMovies());
      expect(result.current.movies).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('loadMoreMovies', () => {
    it('should load movies from backend API', async () => {
      const apiResponse = [
        { _id: 1, original_title: 'Movie 1', year: 2020, estimated_country: 'JP', director: 'Director A',
          imdb_vote_average: 8.5, vote_average: 8.0, genres: ['Drama'], poster_path: '/p1.jpg', overview: 'Desc 1' },
        { _id: 2, original_title: 'Movie 2', year: 2021, estimated_country: 'FR', director: 'Director B',
          imdb_vote_average: 0, vote_average: 7.5, genres: ['Comedy'], poster_path: '/p2.jpg', overview: 'Desc 2' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => apiResponse,
      });

      const { result } = renderHook(() => useMovies());

      await act(async () => {
        await result.current.loadMoreMovies(Date.now());
      });

      expect(result.current.movies.length).toBe(2);
      expect(result.current.movies[0].title).toBe('Movie 1');
      expect(result.current.movies[0].country).toBe('Japan'); // Intl.DisplayNames returns full name
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/view/random/best/')
      );
    });

    it('should handle country-specific loading', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [{
          _id: 3, original_title: 'Movie SE', year: 2022, estimated_country: 'SE',
          director: 'Director C', imdb_vote_average: 9.0, vote_average: 8.5,
          genres: ['Thriller'], poster_path: '/p3.jpg', overview: 'Desc 3',
        }],
      });

      const { result } = renderHook(() => useMovies('SE'));

      await act(async () => {
        await result.current.loadMoreMovies(Date.now(), 'SE');
      });

      expect(result.current.movies.length).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/view/best/SE')
      );
    });

    it('should handle genre filtering', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useMovies());

      await act(async () => {
        await result.current.loadMoreMovies(Date.now(), undefined, undefined, 'Drama');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('genres=Drama')
      );
    });

    it('should not load if already loading', async () => {
      // We need a way to track loading state without a pending promise.
      // Use a deferred promise pattern: resolve it later to clean up.
      let resolveFetch: (value: Response) => void;
      const deferredPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      mockFetch.mockReturnValue(deferredPromise);

      const { result, unmount } = renderHook(() => useMovies());

      // First call starts loading (doesn't await - fire-and-forget to avoid hanging)
      // We just verify the second call is blocked while loading=true
      act(() => {
        result.current.loadMoreMovies(Date.now());
      });

      // Let the setState from the first call flush
      await new Promise(r => setTimeout(r, 10));

      // Second call should be ignored because loading is true
      await act(async () => {
        await result.current.loadMoreMovies(Date.now());
      });

      // Should only have called fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clean up: resolve the deferred promise so pending state doesn't leak
      mockFetch.mockResolvedValue([]);
      resolveFetch!([]);
      await new Promise(r => setTimeout(r, 10));
      act(() => {});
      unmount();
    });
  });

  describe('fetchMovieDetails', () => {
    it('should fetch movie details by ID', async () => {
      const movieDetail = {
        _id: 1, original_title: 'Akira', year: 1988, estimated_country: 'JP',
        director: 'Katsuhiro Otomo', imdb_vote_average: 8.0, vote_average: 7.5,
        genres: [{ name: 'Animation' }, { name: 'Sci-Fi' }],
        poster_path: '/akira.jpg', overview: 'Neo-Tokyo',
        credits: { crew: [{ job: 'Director', name: 'Katsuhiro Otomo' }] },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => movieDetail,
      });

      const rendered = renderHook(() => useMovies());
      // Check if result.current is null or the hook returned something
      expect(rendered.result.current).not.toBeNull();
      expect(rendered.result.current).toBeDefined();
      expect(rendered.result.current).toHaveProperty('fetchMovieDetails');

      const movie = await rendered.result.current.fetchMovieDetails(1);

      expect(movie?.title).toBe('Akira');
      expect(movie?.year).toBe(1988);
      expect(movie?.country).toBe('Japan');
    });

    it('should return null when movie not found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const rendered = renderHook(() => useMovies());
      expect(rendered.result.current).not.toBeNull();

      const movie = await rendered.result.current.fetchMovieDetails(999);
      expect(movie).toBeNull();
    });
  });

  describe('loadMoviesByDirector', () => {
    it('should fetch movies by director from backend API', async () => {
      const apiResponse = [
        { _id: 1, original_title: 'Seven Samurai', year: 1954, estimated_country: 'JP',
          director: 'Akira Kurosawa', imdb_vote_average: 8.5, vote_average: 8.0,
          genres: ['Drama'], poster_path: '/seven-samurai.jpg', overview: 'Classic epic' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => apiResponse,
      });

      const { result } = renderHook(() => useMovies());

      await act(async () => {
        await result.current.loadMoviesByDirector('Akira Kurosawa');
      });

      expect(result.current.movies.length).toBe(1);
      expect(result.current.movies[0].title).toBe('Seven Samurai');
      expect(result.current.loading).toBe(false);
    });

    it('should encode director name in the URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useMovies());

      await act(async () => {
        await result.current.loadMoviesByDirector('Akira Kurosawa');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/director/Akira%20Kurosawa')
      );
    });

    it('should reset movies and set loading when starting new director load', async () => {
      const initialMovies: Movie[] = [{
        id: 1, title: 'Existing Movie', year: 2020, country: 'Other Country',
        countryCode: 'XX', countryFlag: '', director: 'Other Director', rating: 7.5,
        genres: ['Drama'], poster: '/p.jpg', description: 'Desc'
      }];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useMovies());

      // Simulate initial state with movies
      await act(async () => {
        result.current.movies.push(initialMovies[0]);
      });

      await act(async () => {
        await result.current.loadMoviesByDirector('New Director');
      });

      expect(result.current.movies).toHaveLength(0);
      expect(result.current.loading).toBe(false);
    });

    it('should handle errors when fetching director movies', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useMovies());

      // Should not throw, should handle gracefully
      await act(async () => {
        await result.current.loadMoviesByDirector('Some Director');
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('loadMoreMoviesByDirector', () => {
    it('should load more movies using pagination', async () => {
      const existingMovie = {
        _id: 1, original_title: 'Seven Samurai', year: 1954, estimated_country: 'JP',
        director: 'Akira Kurosawa', imdb_vote_average: 8.5, vote_average: 8.0,
        genres: ['Drama'], poster_path: '/seven-samurai.jpg', overview: 'Classic epic',
      };
      const moreMovie = {
        _id: 2, original_title: 'Rashomon', year: 1950, estimated_country: 'JP',
        director: 'Akira Kurosawa', imdb_vote_average: 8.0, vote_average: 7.5,
        genres: ['Drama'], poster_path: '/rashomon.jpg', overview: 'Rashomon'
      };

      // Initial fetch for existing movies
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [existingMovie],
      });

      // Second fetch for more movies
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [moreMovie],
      });

      const { result } = renderHook(() => useMovies());

      // Load initial movies
      await act(async () => {
        await result.current.loadMoviesByDirector('Akira Kurosawa');
      });

      expect(result.current.movies).toHaveLength(1);

      // Load more movies
      await act(async () => {
        await result.current.loadMoreMoviesByDirector('Akira Kurosawa');
      });

      expect(result.current.movies).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('skip=1')
      );
    });
  });
});
