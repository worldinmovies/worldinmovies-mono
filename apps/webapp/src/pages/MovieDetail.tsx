import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMovies } from "@/hooks/useMovies";
import { useSEO } from "@/hooks/useSEO";
import { Movie } from "@/lib/models";
import { useMediaQuery } from "@/hooks/use-media-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MapPin, 
  Calendar, 
  User, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Bookmark, 
  BookmarkCheck, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Flag } from "./Flag";

interface MovieDetailProps {
  onClose?: () => void;
}

export const MovieDetail = ({ onClose }: MovieDetailProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchMovieDetails, loading } = useMovies();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (id) {
      fetchMovieDetails(Number(id)).then(setMovie);
    }
  }, [id, fetchMovieDetails]);

  useEffect(() => {
    if (movie) {
      useSEO({
        title: movie.title,
        description: movie.description,
        ogType: 'video',
        ogImage: movie.poster,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "Movie",
          "name": movie.title,
          "image": movie.poster,
          "datePublished": String(movie.year),
          "director": {
            "@type": "Person",
            "name": movie.director
          },
          "description": movie.description,
          "genre": movie.genres.join(', '),
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": movie.rating,
            "reviewCount": "100"
          },
          "actor": movie.cast?.map(name => ({
            "@type": "Person",
            "name": name
          })),
          "productionCompany": movie.production_companies?.map(name => ({
            "@type": "Organization",
            "name": name
          })),
          "mainEntityOfPage": window.location.href
        }
      });
    }
  }, [movie]);

  if (isLoading || !movie) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!id) {
    return <div className="p-8 text-center">Invalid Movie ID</div>;
  }

  // If mobile, we might want to keep the modal behavior for consistency with discovery
  // or just render it as a full page. Given the "SEO" goal, a full page is better.
  // However, for a seamless transition, we can use the Dialog component but controlled by route/state.
  // But for simplicity in this task, let's implement it as a proper page.

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gradient-card border border-border rounded-xl overflow-hidden shadow-cinematic">
          {/* Movie Poster */}
          <div className="relative">
            <div className="aspect-[2/3] overflow-hidden">
              <img
                src={movie.poster}
                alt={`${movie.title} poster`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList?.remove('hidden');
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
          <div className="p-6 md:p-10 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                {movie.title}
              </h1>
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
                {movie.genres.join(', ')}
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {movie.description}
              </p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>Directed by <span className="text-foreground font-medium">{movie.director}</span></span>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Actions</h3>
              <div className="flex gap-4">
                <Button 
                   variant="default" 
                   className="flex-1"
                   onClick={() => toast.success("Action not implemented in this demo")}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Watchlist
                </Button>
                <Button 
                   variant="outline" 
                   className="flex-1"
                   onClick={() => toast.success("Action not implemented in this demo")}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Seen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
