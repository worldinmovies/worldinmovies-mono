import { useEffect, useState } from "react";
import { Star, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Movie } from "@/lib/models";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
}

export const MovieCard = ({ movie, onClick }: MovieCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useSEO({
    title: movie.title,
    description: movie.description,
    ogType: 'video',
    ogImage: movie.poster,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Movie",
      "name": movie.title,
      "datePublished": String(movie.year),
      "director": {
        "@type": "Person",
        "name": movie.director
      },
      "countryOfOrigin": movie.country,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": String(movie.rating),
        "bestRating": "10",
        "worstRating": "1"
      },
      "genre": movie.genres?.join(", ")
    }
  });

  return (
    <Link to={`/movie/${movie.id}`} className="group relative block">
      <Card
        className="group relative overflow-hidden bg-gradient-card border-border hover:border-primary/50 transition-all duration-500 hover:scale-105 hover:shadow-cinematic"
        onClick={onClick}
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          {!imageError ? (
            <img
              src={movie.poster}
              alt={`${movie.title} (${movie.year}) - ${movie.director} - ${movie.genres?.join(', ')}`.trim()}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-card flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-4xl mb-2">🎬</div>
                <div className="text-lg text-muted-foreground">No poster available</div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <Star className="w-3 h-3 fill-cinema-gold text-cinema-gold" />
            <span className="text-sm font-medium text-foreground">{movie.rating}</span>
          </div>
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <span className="text-sm">
              {movie.countryFlag && (
                <img
                  src={movie.countryFlag}
                  alt={movie.country}
                  style={{ width: 14, height: 14, marginRight: 0 }}
                />
              )}
            </span>
            <MapPin className="w-3 h-3 text-cinema-silver" />
          </div>
        </div>
        <div className="p-3 md:p-4 space-y-1.5 md:space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {movie.title}
            </h3>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {movie.year}
            </span>
          </div>
          <p className="text-sm text-cinema-silver">{movie.country}</p>
          <p className="text-sm text-muted-foreground">Dir. {movie.director}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground">
              {movie.genres?.join(', ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3 pt-2 hidden md:block">
            {movie.description}
          </p>
        </div>
      </Card>
    </Link>
  );
};
