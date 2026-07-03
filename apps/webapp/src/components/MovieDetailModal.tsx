import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Calendar, User, X, ChevronLeft, ChevronRight, Eye, EyeOff, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Movie } from "@/lib/models";
import { Flag } from "./Flag";

interface MovieDetailModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  currentIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  isLoading?: boolean;
}

interface WatchlistItem {
  movie: Movie;
  tag: string;
}

export const MovieDetailModal = ({ movie, isOpen, onClose, movies, currentIndex, onNavigate, isLoading }: MovieDetailModalProps) => {
  const [seenMovies, setSeenMovies] = useState<Movie[]>(() => {
    const saved = localStorage.getItem('seenMovies');
    return saved ? JSON.parse(saved) : [];
  });
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const savedWatchlist = localStorage.getItem('watchlist');
    return savedWatchlist ? JSON.parse(savedWatchlist) : [];
  });
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    // Save seen movies to localStorage and dispatch event
    localStorage.setItem('seenMovies', JSON.stringify(Array.from(seenMovies)));
    window.dispatchEvent(new CustomEvent('seenMoviesChanged', { detail: seenMovies }));
  }, [seenMovies]);

  useEffect(() => {
    // Save watchlist to localStorage and dispatch event
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    window.dispatchEvent(new CustomEvent('watchlistChanged', { detail: watchlist }));
  }, [watchlist]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && currentIndex < movies.length - 1) {
        onNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, movies.length, onNavigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < movies.length - 1) {
      onNavigate('next');
    } else if (isRightSwipe && currentIndex > 0) {
      onNavigate('prev');
    }
  };

  const toggleSeen = () => {
    if (!movie) return;
    
    const newSeenMovies = new Set(seenMovies);
    const seenMovie = seenMovies.find(a => a.id === movie.id);
    if (seenMovie) {
      newSeenMovies.delete(seenMovie);
      toast.success("Removed from seen movies");
    } else {
      newSeenMovies.add(movie);
      toast.success("Added to seen movies");
    }
    setSeenMovies(Array.from(newSeenMovies));
  };

  const handleAddToWatchlist = (tag: string = "watchlist") => {
    if (!movie) return;
    
    setWatchlist([...watchlist, { movie, tag }]);
    toast.success(`Added to watchlist${tag !== "watchlist" ? ` as "${tag}"` : ""}`);
    setShowCustomTagInput(false);
    setCustomTag("");
  };

  const handleRemoveFromWatchlist = () => {
    if (!movie) return;
    
    setWatchlist(watchlist.filter(item => item.movie.id !== movie.id));
    toast.success("Removed from watchlist");
  };

  const handleCustomTagSubmit = () => {
    if (customTag.trim()) {
      handleAddToWatchlist(customTag.trim());
    }
  };

  const handleButtonPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowCustomTagInput(true);
    }, 500); // 500ms for long press
  };

  const handleButtonRelease = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    if (!isLongPressRef.current && !showCustomTagInput) {
      // Short press - add with default tag
      handleAddToWatchlist();
    }
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInWatchlist) {
      handleRemoveFromWatchlist();
    }
  };

  const isInWatchlist = movie ? watchlist.some(item => item.movie.id === movie.id) : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-card border-border w-[calc(100%-4rem)] md:w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading || !movie ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
        <DialogHeader className="relative">
          {/* Navigation buttons */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-0 text-muted-foreground hover:text-foreground"
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          {currentIndex < movies.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-10 top-0 text-muted-foreground hover:text-foreground"
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Movie Poster */}
          <div className="relative">
            <div className="aspect-[2/3] overflow-hidden rounded-lg">
              <img
                src={movie.poster}
                alt={`${movie.title} poster`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full bg-gradient-card flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="text-6xl mb-4">🎬</div>
                  <div className="text-lg text-muted-foreground">No poster available</div>
                </div>
              </div>
            </div>
          </div>

          {/* Movie Details */}
          <div className="space-y-6">
            <div>
              <DialogTitle className="text-3xl font-bold text-foreground mb-2">
                {movie.title}
              </DialogTitle>
              <div className="flex items-center gap-4 text-cinema-silver">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{movie.year}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {movie.countryCode && (
                    <span className="mr-1">
                      <Flag countryCode={movie.countryCode} alt={movie.country}/>
                    </span>
                  )}
                  <span>{movie.country}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 fill-cinema-gold text-cinema-gold" />
                <span className="font-semibold text-foreground">{movie.rating}</span>
              </div>
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                {movie.genres?.join(', ')}
              </Badge>
              <Button
                variant={seenMovies.find(a => a.id === movie.id) ? "default" : "outline"}
                size="sm"
                onClick={toggleSeen}
                className="flex items-center gap-2"
              >
                {seenMovies.find(a => a.id === movie.id) ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Seen
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Mark as Seen
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {isInWatchlist ? "Watchlist" : "Add to Watchlist"}
              </h4>
              {showCustomTagInput && !isInWatchlist ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Enter custom tag..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomTagSubmit();
                      } else if (e.key === 'Escape') {
                        setShowCustomTagInput(false);
                        setCustomTag("");
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCustomTagSubmit}
                    disabled={!customTag.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCustomTagInput(false);
                      setCustomTag("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant={isInWatchlist ? "default" : "outline"}
                    size="sm"
                    onMouseDown={isInWatchlist ? undefined : handleButtonPress}
                    onMouseUp={isInWatchlist ? undefined : handleButtonRelease}
                    onMouseLeave={() => {
                      if (longPressTimerRef.current) {
                        clearTimeout(longPressTimerRef.current);
                      }
                    }}
                    onTouchStart={isInWatchlist ? undefined : handleButtonPress}
                    onTouchEnd={isInWatchlist ? undefined : handleButtonRelease}
                    onClick={handleWatchlistClick}
                    className="flex items-center gap-2"
                  >
                    {isInWatchlist ? (
                      <>
                        <BookmarkCheck className="w-4 h-4" />
                        Remove from Watchlist
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        Add to Watchlist
                      </>
                    )}
                  </Button>
                  {!isInWatchlist && (
                    <p className="text-xs text-muted-foreground">
                      Hold for custom tag
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Directed by <span className="text-foreground font-medium">{movie.director}</span></span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Synopsis</h3>
              <p className="text-muted-foreground leading-relaxed">
                {movie.description}
              </p>
            </div>
          </div>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
};