import { Filter, Bookmark } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { CountryFilter } from "./CountryFilter";
import { Movie } from "@/lib/models";

interface WatchlistItem {
  movie: Movie;
  tag: string;
}

interface MovieFiltersProps {
  selectedCountry: string | null;
  onCountrySelect: (country: string | null) => void;
  availableCountries: Array<{ country: string; countryCode: string; flag: string }>;
  seenMovies: Movie[];
  movies: Movie[];
  seenFilter: 'all' | 'seen' | 'unseen';
  onSeenFilterChange: (filter: 'all' | 'seen' | 'unseen') => void;
  watchlistFilter: string;
  onWatchlistFilterChange: (filter: string) => void;
  uniqueWatchlistTags: string[];
  genreFilter: string;
  onGenreFilterChange: (genre: string) => void;
  uniqueGenres: string[];
}

export const MovieFilters = ({
  selectedCountry,
  onCountrySelect,
  availableCountries,
  seenMovies,
  movies,
  seenFilter,
  onSeenFilterChange,
  watchlistFilter,
  onWatchlistFilterChange,
  uniqueWatchlistTags,
  genreFilter,
  onGenreFilterChange,
  uniqueGenres,
}: MovieFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center sm:justify-between items-center">
      <CountryFilter 
        selectedCountry={selectedCountry}
        onCountrySelect={onCountrySelect}
        availableCountries={availableCountries}
        seenMovies={seenMovies}
        movies={movies}
      />
      
      <div className="flex flex-wrap gap-2">
        {/* Watchlist Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              {watchlistFilter === 'all' ? 'All Movies' : 
               watchlistFilter === 'any' ? 'In Watchlist' : 
               watchlistFilter.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onWatchlistFilterChange('all')}>
              All Movies
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onWatchlistFilterChange('any')}>
              In Watchlist
            </DropdownMenuItem>
            {uniqueWatchlistTags.filter(tag => tag !== 'all' && tag !== 'any').map(tag => (
              <DropdownMenuItem key={tag} onClick={() => onWatchlistFilterChange(tag)}>
                {tag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
            <DropdownMenuItem onClick={() => onSeenFilterChange('all')}>
              All Movies
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSeenFilterChange('seen')}>
              Seen Movies
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSeenFilterChange('unseen')}>
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
              <DropdownMenuItem key={genre} onClick={() => onGenreFilterChange(genre)}>
                {genre === 'all' ? 'All Genres' : genre}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
