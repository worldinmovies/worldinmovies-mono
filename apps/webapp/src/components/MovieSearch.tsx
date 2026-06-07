import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Command, CommandGroup, CommandItem, CommandList } from "./ui/command";
import { Movie } from "@/lib/models";
import { BACKEND_URL } from "@/lib/config";
import * as Sentry from "@sentry/react";

interface SearchResponse {
  hits: SearchHit[];
}

interface SearchHit {
  id: number;
  title: string;
  estimated_country: string;
  overview: string;
  directors: string[];
  weighted_rating: number;
  guessed_country: string;
  original_title: string;
  poster: string;
  year: string;
}

interface MovieSearchProps {
  movies: Movie[];
  onMovieSelect: (movieId: number) => void;
}

export const MovieSearch = ({ movies, onMovieSelect }: MovieSearchProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`${BACKEND_URL}/search/movies/${encodeURIComponent(searchQuery)}`);
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          const data: SearchResponse = await response.json();
          setSearchSuggestions(data.hits.sort((a,b) => b.weighted_rating - a.weighted_rating).slice(0, 8));
          setShowSuggestions(true);
        }
      } catch (error) {
        Sentry.captureException(error);
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, movies]);

  const handleSuggestionClick = (movie: SearchHit) => {
    setSearchQuery("");
    setShowSuggestions(false);
    setSearchSuggestions([]);
    onMovieSelect(movie.id);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative max-w-xl mx-auto w-full">
      <Search className="absolute left-3 top-6 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
      <Input
        type="text"
        placeholder="Search by title, director, or country..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => searchQuery.trim().length > 0 && searchSuggestions.length > 0 && setShowSuggestions(true)}
        className="pl-10 pr-4 py-6 text-lg bg-card border-border"
      />
      {isSearching && (
        <Loader2 className="absolute right-3 top-6 transform -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
      )}
      
      {/* Suggestions Dropdown */}
      {showSuggestions && searchSuggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <Command>
            <CommandList>
              <CommandGroup>
                {searchSuggestions.map((movie) => (
                  <CommandItem
                    key={movie.id}
                    onSelect={() => handleSuggestionClick(movie)}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <div className="flex items-center gap-3 w-full py-1">
                      <img
                        src={`https://image.tmdb.org/t/p/w200/${movie.poster}`}
                        alt={movie.title}
                        className="w-12 h-16 object-cover rounded"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{movie.title}</p>
                        <p className="text-sm text-muted-foreground">{movie.year}</p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};
