import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Movie, BackendMovie, DiscoverMovie } from "@/lib/models";
import { getBackendUrl } from "@/lib/config";
import { shuffleArray, transferDiscoverMovie, transferBackendMovie } from "@/lib/transforms";
import * as Sentry from "@sentry/react";

// Mock data for top international films
const MOVIE_DATABASE: Movie[] = [
  // ... (keep existing mock data)
];

export const useMovies = (selectedCountry?: string | null) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Add reset function
  const resetMovies = useCallback(() => {
    setMovies([]);
    setHasMore(true);
  }, []);

  const loadMoreMovies = useCallback(
    async (seed: number, countryCode?: string, skipOverride?: number, genres?: string, shouldReset: boolean = false) => {
      if (loading || (!hasMore && !shouldReset)) return;

      setLoading(true);

      // Reset movies if requested
      if (shouldReset) {
        setMovies([]);
        setHasMore(true);
      }

      try {
        if (getBackendUrl()) {
          // Fetch from backend API
          let url: string;
          // Use skipOverride if provided, otherwise use current movies.length
          // When resetting, always start from 0
          const skipMovies = shouldReset ? 0 : (skipOverride !== undefined ? skipOverride : movies.length);

          let genre_match = '';
          if(genres && !genres.includes('all')) {
            genre_match = `&genres=${genres}`
          }

          const limit = 8;
          if (countryCode || selectedCountry) {
            const code = countryCode || selectedCountry;
            url = `${getBackendUrl()}/view/best/${code.toUpperCase()}?skip=${skipMovies}${genre_match}&limit=${limit}`;
          } else {
            url = `${getBackendUrl()}/view/random/best/${skipMovies}?seed=${seed}${genre_match}&limit=${limit}`;
          }

          const response = await fetch(url);
          if (response.ok) {
            const newMovies = await response.json();
            const mapped: Movie[] = newMovies.map((movie: DiscoverMovie) => (transferDiscoverMovie(movie)));

            if (mapped.length === 0) {
              setHasMore(false);
            } else {
              setMovies((prev) => shouldReset ? mapped : [...prev, ...mapped]);
            }
          } else {
            toast.error(`Error on calling backend ${response.body}`);
          }
        } else {
          // Fallback to mock data
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const shuffled = shuffleArray([...MOVIE_DATABASE]);
          const existingIds = shouldReset ? new Set() : new Set(movies.map((m) => m.id));
          const newMovies = shuffled
            .filter((movie) => !existingIds.has(movie.id))
            .slice(0, 6);

          if (newMovies.length === 0) {
            setHasMore(false);
          } else {
            setMovies((prev) => shouldReset ? newMovies : [...prev, ...newMovies]);
          }
        }
      } catch (error) {
        Sentry.captureException(error);
        console.error(`Error loading movies: ${JSON.stringify(error)}`);
        // Do NOT silently fall back to MOVIE_DATABASE — it is empty, so the
        // grid would render zero cards with no visible error. Surface the
        // failure and stop the observer from retrying.
        toast.error("Failed to load movies. Please try again.");
        setHasMore(false);
      }

      setLoading(false);
    },
    [loading, hasMore, movies, selectedCountry],
  );

  const loadMoviesForCountry = useCallback(async (countryCode: string) => {
    setMovies([]);
    setHasMore(true);
    setLoading(true);

    try {
      if (getBackendUrl()) {
        const limit = 10;
        const url = `${getBackendUrl()}/view/best/${countryCode.toUpperCase()}?skip=0&limit=${limit}`;
        const response = await fetch(url);
        if (response.ok) {
          const newMovies = await response.json();
          const mapped: Movie[] = newMovies.map((movie: DiscoverMovie) => transferDiscoverMovie(movie));

          if (mapped.length === 0) {
            setHasMore(false);
          } else {
            setMovies(mapped);
          }
        } else {
          toast.error(`Error on calling backend ${response.body}`);
        }
      } else {
        // Fallback to mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const shuffled = shuffleArray([...MOVIE_DATABASE]);
        const newMovies = shuffled.slice(0, 6);
        setMovies(newMovies);
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error loading movies for country:", error);
      toast.error("Failed to load movies for this country.");
    }

    setLoading(false);
  }, []);

  const fetchMovieDetails = useCallback(
    async (movieId: number) => {
      if (!getBackendUrl()) {
        // Return existing movie data if no backend
        return movies.find((m) => m.id === movieId);
      }

      try {
        const response = await fetch(`${getBackendUrl()}/movie/${movieId}`);
        if (response.ok) {
          const data: BackendMovie = await response.json();
          if(data) {
            return transferBackendMovie(data);
          } else {
            return null;
          }
        }
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error fetching movie details:", error);
      }

      // Fallback to existing data
      return movies.find((m) => m.id === movieId);
    },
    [movies],
  );

  return {
    movies,
    loading,
    hasMore,
    loadMoreMovies,
    loadMoviesForCountry,
    fetchMovieDetails,
  };
};