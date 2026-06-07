import { useEffect, useState, useMemo } from "react";
import { MovieCard } from "@/components/MovieCard";
import { useSEO } from "@/hooks/useSEO";
import { MovieDetailModal } from "@/components/MovieDetailModal";
import { Movie } from "@/lib/models";
import { CountryFilter } from "@/components/CountryFilter";
import { Separator } from "@/components/ui/separator";
import { Bookmark, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import countryData from '@/assets/countrycodes.json';

interface WatchlistItem {
  movie: Movie;
  tag: string;
}

const Watchlist = () => {
  useSEO({
    title: "My Watchlist - World Cinema",
    description: "Your saved collection of international films. Track movies from around the world and organize your watchlist by country, genre, and tags.",
    keywords: "movie watchlist, international films, film tracking, world cinema collection",
    canonicalUrl: "https://worldinmovies.com/watchlist"
  });

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [seenFilter, setSeenFilter] = useState<'all' | 'seen' | 'unseen'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [seenMovies, setSeenMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get unique tags from watchlist
  const uniqueTags = useMemo(() => {
    const tags = new Set(watchlist.map(item => item.tag));
    return ['all', ...Array.from(tags).sort()];
  }, [watchlist]);

  // Get unique genres from watchlist
  const uniqueGenres = useMemo(() => {
    const genres = new Set<string>();
    watchlist.forEach(item => {
      if (item.movie.genres) {
        item.movie.genres.forEach(g => genres.add(g.trim()));
      }
    });
    return ['all', ...Array.from(genres).sort()];
  }, [watchlist]);

  // Get countries from watchlist
  const countries = useMemo(() => {
    return Object.entries(countryData).map(([code, name]) => ({
      country: name,
      countryCode: code,
      flag: `https://flagcdn.com/16x12/${code.toLowerCase()}.png`
    }));
  }, []);

  useEffect(() => {
    const loadData = () => {
      const savedWatchlist = localStorage.getItem('watchlist');
      if (savedWatchlist) {
        setWatchlist(JSON.parse(savedWatchlist));
      }
      
      const savedSeen = localStorage.getItem('seenMovies');
      if (savedSeen) {
        setSeenMovies(JSON.parse(savedSeen));
      }
    };

    loadData();

    // Listen to custom events for real-time updates
    const handleWatchlistChanged = (e: CustomEvent) => {
      setWatchlist(e.detail);
    };
    
    const handleSeenChanged = (e: CustomEvent) => {
      setSeenMovies(e.detail);
    };

    window.addEventListener('watchlistChanged', handleWatchlistChanged as EventListener);
    window.addEventListener('seenMoviesChanged', handleSeenChanged as EventListener);

    return () => {
      window.removeEventListener('watchlistChanged', handleWatchlistChanged as EventListener);
      window.removeEventListener('seenMoviesChanged', handleSeenChanged as EventListener);
    };
  }, []);

  const filteredMovies = useMemo(() => {
    let filtered = watchlist;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.movie.title.toLowerCase().includes(query) ||
        item.movie.director?.toLowerCase().includes(query) ||
        item.movie.country?.toLowerCase().includes(query)
      );
    }
    
    // Filter by country
    if (selectedCountry) {
      filtered = filtered.filter(item => item.movie.country === selectedCountry);
    }
    
    // Filter by tag
    if (tagFilter !== 'all') {
      filtered = filtered.filter(item => item.tag === tagFilter);
    }
    
    // Filter by seen status
    if (seenFilter === 'seen') {
      filtered = filtered.filter(item => seenMovies.find(a => a.id === item.movie.id));
    } else if (seenFilter === 'unseen') {
      filtered = filtered.filter(item => !seenMovies.find(a => a.id === item.movie.id));
    }
    
    // Filter by genre
    if (genreFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.movie.genres.map(a => a.toLowerCase().includes(genreFilter.toLowerCase()))
      );
    }
    
    return filtered;
  }, [watchlist, selectedCountry, tagFilter, seenFilter, seenMovies, searchQuery, genreFilter]);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleModalNavigation = (direction: 'prev' | 'next') => {
    const movies = filteredMovies.map(item => item.movie);
    const currentIndex = movies.findIndex(m => m.id === selectedMovie?.id);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedMovie(movies[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < movies.length - 1) {
      setSelectedMovie(movies[currentIndex + 1]);
    }
  };

  const handleCountrySelect = (country: string | null) => {
    setSelectedCountry(country);
  };

  const capitalizeTag = (tag: string) => {
    return tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Bookmark className="w-10 h-10 text-cinema-gold" />
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-accent bg-clip-text text-transparent">
                  My Watchlist
                </span>
              </h1>
            </div>
            <p className="text-xl text-cinema-silver max-w-2xl mx-auto">
              Movies you've saved to watch later, organized by your preferences
            </p>
          </div>

          {watchlist.length === 0 ? (
            <div className="text-center py-20">
              <Bookmark className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Your watchlist is empty</h2>
              <p className="text-muted-foreground">
                Start adding movies you want to watch by clicking the bookmark icon on any movie
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 mb-8">
                {/* Search Bar */}
                <div className="relative max-w-xl mx-auto w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by title, director, or country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-6 text-lg bg-card border-border"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 justify-center sm:justify-between items-center">
                  <CountryFilter 
                    selectedCountry={selectedCountry}
                    onCountrySelect={handleCountrySelect}
                    availableCountries={countries}
                    seenMovies={seenMovies}
                    movies={watchlist.map(item => item.movie)}
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    {/* Tag Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4" />
                          {tagFilter === 'all' ? 'All Tags' : capitalizeTag(tagFilter)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTagFilter('all')}>
                          All Tags
                        </DropdownMenuItem>
                        {uniqueTags.filter(tag => tag !== 'all').map(tag => (
                          <DropdownMenuItem key={tag} onClick={() => setTagFilter(tag)}>
                            {capitalizeTag(tag)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Seen Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          {seenFilter === 'all' ? 'All' : seenFilter === 'seen' ? 'Seen' : 'Unseen'}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSeenFilter('all')}>
                          All Movies
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSeenFilter('seen')}>
                          Seen Movies
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSeenFilter('unseen')}>
                          Unseen Movies
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Genre Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          {genreFilter === 'all' ? 'All Genres' : genreFilter}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                        {uniqueGenres.map(genre => (
                          <DropdownMenuItem key={genre} onClick={() => setGenreFilter(genre)}>
                            {genre === 'all' ? 'All Genres' : genre}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              <div className="mb-6 text-center">
                <p className="text-muted-foreground">
                  {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'} in your watchlist
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredMovies.map((item) => (
                  <MovieCard 
                    key={item.movie.id}
                    movie={item.movie} 
                    onClick={() => handleMovieSelect(item.movie)}
                  />
                ))}
              </div>
            </>
          )}

          <MovieDetailModal 
            movie={selectedMovie}
            isOpen={!!selectedMovie}
            onClose={() => setSelectedMovie(null)}
            movies={filteredMovies.map(item => item.movie)}
            currentIndex={filteredMovies.findIndex(item => item.movie.id === selectedMovie?.id)}
            onNavigate={handleModalNavigation}
          />
        </div>
      </section>
    </main>
  );
};

export default Watchlist;
