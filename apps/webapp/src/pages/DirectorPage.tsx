import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSEO } from "@/hooks/useSEO";
import { useMovies } from "@/hooks/useMovies";
import { MovieCard } from "@/components/MovieCard";
import { Loader2 } from "lucide-react";

const buildDirectorStructuredData = (
  directorName: string,
  movieCount: number,
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": directorName,
  "jobTitle": "Film Director",
  "sameAs": [],
});

export const DirectorPage = () => {
  const { directorName = "" } = useParams<{ directorName: string }>();
  const navigate = useNavigate();
  const { movies, loading, loadMoreMovies, loadMoviesByDirector } =
    useMovies();
  const observerRef = useRef<HTMLDivElement>(null);
  const [seed] = useState(() => Date.now());
  const decodedName = decodeURIComponent(directorName);

  useSEO({
    title: `${decodedName} – Director Filmography`,
    description: `Explore all films directed by ${decodedName}. Discover top-ranked movies, cinema classics, and signature works from ${decodedName}.`,
    keywords: `${decodedName.toLowerCase()} films, ${decodedName.toLowerCase()} movies, director filmography, world cinema`,
    canonicalUrl: `https://worldinmovies.com/director/${encodeURIComponent(directorName)}`,
    structuredData: buildDirectorStructuredData(decodedName, movies.length),
  });

  // Load movies for this director on mount
  useEffect(() => {
    loadMoviesByDirector(decodedName);
  }, [decodedName, loadMoviesByDirector]);

  // Intersection observer for infinite scroll
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !loading) {
        loadMoreMovies(
          seed,
          undefined,
          movies.length,
          "all",
          false,
        );
      }
    },
    [loading, loadMoreMovies, seed, movies.length],
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

  return (
    <main className="min-h-screen bg-background">
      {/* Back navigation */}
      <div className="py-4 px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
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
            {decodedName}
          </h1>
          <p className="text-xl text-cinema-silver max-w-2xl mx-auto">
            Explore all films directed by {decodedName}. Discover top-ranked
            movies, cinema classics, and signature works from {decodedName}.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Badge variant="secondary" className="flex items-center gap-1">
              {decodedName}
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
                Films by {decodedName}
              </span>
            </h2>
            <p className="text-lg text-cinema-silver max-w-2xl mx-auto">
              Curated collection of films directed by {decodedName}.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => navigate(`/movie/${movie.id}`)}
                onDirectorClick={() => {}}
              />
            ))}
          </div>

          {movies.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No films found from {decodedName}. Try searching for a different
                director.
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