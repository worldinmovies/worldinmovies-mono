import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSEO } from "@/hooks/useSEO";
import { useMovies } from "@/hooks/useMovies";
import { MovieCard } from "@/components/MovieCard";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

const buildDirectorStructuredData = (
  directorName: string,
  movieCount: number,
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "World in Movies",
      "url": "https://worldinmovies.com",
      "description":
        "Discover and track international cinema masterpieces from around the globe",
    },
    {
      "@type": "Person",
      "name": directorName,
      "jobTitle": "Director",
      "knowsAbout": "Film",
      "sameAs": `https://worldinmovies.com/director/${encodeURIComponent(directorName)}`,
    },
    {
      "@type": "CollectionPage",
      "name": `${directorName} Filmography`,
      "about": {
        "@type": "Person",
        "name": directorName,
      },
    },
  ],
});

const DirectorPage = () => {
  const navigate = useNavigate();
  const { directorName: encodedDirectorName = "" } = useParams<{ directorName: string }>();
  const directorName = decodeURIComponent(encodedDirectorName);
  const { movies, loading, loadMoreMoviesByDirector, loadMoviesByDirector, hasMore } = useMovies();
  const observerRef = useRef<HTMLDivElement>(null);

  useSEO({
    title: `${directorName} - Filmography`,
    description: `Browse all films directed by ${directorName}. Discover the complete filmography of this acclaimed director.`,
    keywords: `${directorName} films, ${directorName} movies, filmography, cinema, movies`,
    canonicalUrl: `https://worldinmovies.com/director/${encodeURIComponent(directorName).replace(/%20/g, '-').toLowerCase()}`,
    structuredData: buildDirectorStructuredData(directorName, movies.length),
  });

  // Load movies for this director on mount
  useEffect(() => {
    if (directorName) {
      loadMoviesByDirector(directorName);
    }
  }, [directorName, loadMoviesByDirector]);

  // Intersection observer for infinite scroll
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        loadMoreMoviesByDirector(directorName);
      }
    },
    [loading, hasMore, loadMoreMoviesByDirector, directorName],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: "400px 0px",
      threshold: 0,
    });
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, [handleIntersection]);

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Back navigation */}
      <div className="py-4 px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Hero Section */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
            {directorName}
          </h1>
          <p className="text-xl text-cinema-silver max-w-2xl mx-auto">
            Director • Filmography • {movies.length} films
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="text-sm font-medium">{movies.length} films</span>
            </Badge>
          </div>
        </div>
      </section>

      <Separator className="max-w-4xl mx-auto mb-8" />

      {/* Movies Grid */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                Films by {directorName}
              </span>
            </h2>
            <p className="text-lg text-cinema-silver max-w-2xl mx-auto">
              Curated collection of films directed by {directorName}.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => navigate(`/movie/${movie.id}`)}
              />
            ))}
          </div>

          {movies.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No films found for {directorName}. Try selecting a different director.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-3 text-cinema-gold">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-lg">Discovering more films...</span>
              </div>
            </div>
          )}

          <div ref={observerRef} className="h-20" />
        </div>
      </section>
    </main>
  );
};

export default DirectorPage;