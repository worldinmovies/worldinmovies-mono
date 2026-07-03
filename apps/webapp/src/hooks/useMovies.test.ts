import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMovies } from '@/hooks/useMovies';

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
      let resolveFetch: (value: any) => void;
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
});
