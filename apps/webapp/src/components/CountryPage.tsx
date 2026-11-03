import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Flag } from "@/components/Flag";
import { useSEO } from "@/hooks/useSEO";
import { useMovies } from "@/hooks/useMovies";
import { MovieCard } from "@/components/MovieCard";
import { Loader2 } from "lucide-react";
import countryData from "@/assets/countrycodes.json";

interface CountryPageProps {
  countryCode: string;
}

const buildCountryStructuredData = (
  countryCode: string,
  countryName: string,
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
      "@type": "Country",
      "name": countryName,
    },
  ],
});

export const CountryPage = ({ countryCode }: CountryPageProps) => {
  const navigate = useNavigate();
  const countryName =
    countryData[countryCode.toUpperCase()] || countryCode;
  const { movies, loading, loadMoreMovies, loadMoviesForCountry } =
    useMovies();
  const observerRef = useRef<HTMLDivElement>(null);
  const [seed] = useState(() => Date.now());

  useSEO({
    // useSEO appends " | World in Movies" to document.title, so pass the
    // title without the site suffix (final: "<X> | World in Movies").
    title: `${countryName} Cinema – Top Films from ${countryName}`,
    description: `Discover the best movies from ${countryName}. Explore top-ranked films, cinema classics, and emerging directors from ${countryName}.`,
    keywords: `${countryName.toLowerCase()} cinema, ${countryName.toLowerCase()} films, world cinema, international movies, ${countryName.toLowerCase()} directors`,
    canonicalUrl: `https://worldinmovies.com/country/${countryCode.toLowerCase()}`,
    structuredData: buildCountryStructuredData(countryCode, countryName),
  });

  // Load movies for this country on mount
  useEffect(() => {
    loadMoviesForCountry(countryCode.toUpperCase());
  }, [countryCode, loadMoviesForCountry]);

  // Intersection observer for infinite scroll
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !loading) {
        loadMoreMovies(
          seed,
          countryCode.toUpperCase(),
          movies.length,
          "all",
          false,
        );
      }
    },
    [loading, loadMoreMovies, seed, countryCode, movies.length],
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
          <div className="flex items-center justify-center mb-6">
            <Flag
              countryCode={countryCode}
              alt={countryName}
              width={64}
              height={48}
              className="rounded shadow-lg"
            />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
            {countryName} Cinema
          </h1>
          <p className="text-xl text-cinema-silver max-w-2xl mx-auto">
            Discover the best films from {countryName}. Explore top-ranked
            movies, cinema classics, and emerging directors.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Flag
                countryCode={countryCode}
                alt={countryName}
                width={16}
                height={12}
              />
              {countryName}
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
                Top Films from {countryName}
              </span>
            </h2>
            <p className="text-lg text-cinema-silver max-w-2xl mx-auto">
              Curated collection of the highest-rated movies from {countryName}.
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
                No films found from {countryName}. Try selecting a different
                country.
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

export default CountryPage;