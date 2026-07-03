import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { MovieCard } from "./MovieCard";
import { useMovies } from "@/hooks/useMovies";
import { MovieDetailModal } from "./MovieDetailModal";
import { MovieSearch } from "./MovieSearch";
import { MovieFilters } from "./MovieFilters";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { Movie } from "@/lib/models";
import countryData from '@/assets/countrycodes.json';
import genresData from '@/assets/genres.json';
import * as Sentry from "@sentry/react";
import {
  filterByWatchlist,
  filterBySeenStatus,
  buildCountryOptions,
  buildGenreOptions,
  buildWatchlistTagOptions,
  WatchlistItem,
} from "@/lib/filters";

export const MovieGrid = () => {
  const { movies, loading, loadMoreMovies, loadMoviesForCountry, fetchMovieDetails } = useMovies();
  const observerRef = useRef<HTMLDivElement>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [seenFilter, setSeenFilter] = useState<'all' | 'seen' | 'unseen'>('all');
  const [watchlistFilter, setWatchlistFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [seenMovies, setSeenMovies] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loadingMovieDetails, setLoadingMovieDetails] = useState(false);
  const [seed] = useState<number>(Date.now());
  
  // Use refs to store current values for intersection observer
  const selectedCountryRef = useRef<string | null>(null);
  const moviesLengthRef = useRef(0);
  const genreFilterRef = useRef<string>('all');

  // Update refs when values change
  useEffect(() => {
    selectedCountryRef.current = selectedCountry;
  }, [selectedCountry]);

  useEffect(() => {
    moviesLengthRef.current = movies.length;
  }, [movies.length]);

  useEffect(() => {
    genreFilterRef.current = genreFilter;
  }, [genreFilter]);

  // Load seen movies and watchlist from localStorage
  useEffect(() => {
    const loadData = () => {
      const savedSeen = localStorage.getItem('seenMovies');
      if (savedSeen) {
        setSeenMovies(JSON.parse(savedSeen));
      }
      
      const savedWatchlist = localStorage.getItem('watchlist');
      if (savedWatchlist) {
        setWatchlist(JSON.parse(savedWatchlist));
      }
    };
    
    loadData();
    
    // Listen to custom events for real-time updates
    const handleSeenChanged = (e: CustomEvent) => {
      setSeenMovies(e.detail);
    };
    
    const handleWatchlistChanged = (e: CustomEvent) => {
      setWatchlist(e.detail);
    };
    
    window.addEventListener('seenMoviesChanged', handleSeenChanged as EventListener);
    window.addEventListener('watchlistChanged', handleWatchlistChanged as EventListener);
    
    // Initial load
    loadMoreMovies(seed, undefined, 0, genreFilter, true);

    return () => {
      window.removeEventListener('seenMoviesChanged', handleSeenChanged as EventListener);
      window.removeEventListener('watchlistChanged', handleWatchlistChanged as EventListener);
    };
  }, []);

  // Reset and reload when genre or country changes
  useEffect(() => {
    loadMoreMovies(seed, selectedCountry, 0, genreFilter, true);
  }, [genreFilter, selectedCountry]);
  
  const countries = useMemo(() => buildCountryOptions(countryData), []);

  const uniqueGenres = useMemo(() => buildGenreOptions(genresData), []);

  const uniqueWatchlistTags = useMemo(
    () => buildWatchlistTagOptions(watchlist),
    [watchlist],
  );

  const filteredMovies = useMemo(() => {
    let filtered = filterByWatchlist(movies, watchlistFilter, watchlist);
    filtered = filterBySeenStatus(filtered, seenFilter, seenMovies);
    return filtered;
  }, [movies, seenFilter, seenMovies, watchlistFilter, watchlist]);

  const handleMovieSelect = async (movieId: number) => {
    setLoadingMovieDetails(true);
    try {
      const details: Movie = await fetchMovieDetails(movieId);
      setSelectedMovie(details);
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error fetching movie details:", error);
      setSelectedMovie(null);
    } finally {
      setLoadingMovieDetails(false);
    }
  };

  const handleModalNavigation = (direction: 'prev' | 'next') => {
    const currentIndex = filteredMovies.findIndex(m => m.id === selectedMovie?.id);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedMovie(filteredMovies[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < filteredMovies.length - 1) {
      setSelectedMovie(filteredMovies[currentIndex + 1]);
    }
  };

  const handleCountrySelect = useCallback((country: string | null) => {
    setSelectedCountry(country);
    const countryData = countries.find(c => c.country === country);
    if (countryData?.countryCode) {
      loadMoviesForCountry(countryData.countryCode);
    } else if (country === null) {
      setSelectedCountry(null);
      // Reset and reload
      loadMoreMovies(seed, null, 0, genreFilterRef.current, true);
    }
  }, [countries, loadMoviesForCountry, loadMoreMovies, seed]);

  // Intersection observer with stable callback
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && !loading) {
      const countryCode = countries.find(c => c.country === selectedCountryRef.current)?.countryCode;
      loadMoreMovies(seed, countryCode, moviesLengthRef.current, genreFilterRef.current, false);
    }
  }, [loading, loadMoreMovies, countries, seed]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: "400px 0px",
      threshold: 0 
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [handleIntersection]);

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Featured Films
            </span>
          </h2>
          <p className="text-xl text-cinema-silver max-w-2xl mx-auto">
            Discover masterpieces from around the globe, celebrating the art of storytelling
            across cultures and generations.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {/* Search Bar */}
          <MovieSearch 
            movies={movies}
            onMovieSelect={handleMovieSelect}
          />

          {/* Filters */}
          <MovieFilters
            selectedCountry={selectedCountry}
            onCountrySelect={handleCountrySelect}
            availableCountries={countries}
            seenMovies={seenMovies}
            movies={movies}
            seenFilter={seenFilter}
            onSeenFilterChange={setSeenFilter}
            watchlistFilter={watchlistFilter}
            onWatchlistFilterChange={setWatchlistFilter}
            uniqueWatchlistTags={uniqueWatchlistTags}
            genreFilter={genreFilter}
            onGenreFilterChange={setGenreFilter}
            uniqueGenres={uniqueGenres}
          />
        </div>

        <Separator className="my-8" />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard 
              key={`${movie.id}-${Math.random()}`} 
              movie={movie} 
              onClick={() => handleMovieSelect(movie.id)}
            />
          ))}
        </div>

        {filteredMovies.length === 0 && selectedCountry && !loading && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No films found from {selectedCountry}. Try loading more movies or select a different country.
            </p>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-3 text-cinema-gold">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg">Discovering more films...</span>
            </div>
          </div>
        )}

        {/* Intersection observer target */}
        <div ref={observerRef} className="h-20" />

        <MovieDetailModal 
          movie={selectedMovie}
          isOpen={!!selectedMovie || loadingMovieDetails}
          onClose={() => setSelectedMovie(null)}
          movies={filteredMovies}
          currentIndex={filteredMovies.findIndex(m => m.id === selectedMovie?.id)}
          onNavigate={handleModalNavigation}
          isLoading={loadingMovieDetails}
        />
      </div>
    </section>
  );
};