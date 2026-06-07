import { Suspense, lazy } from "react";
import { HeroSection } from "@/components/HeroSection";
import { useSEO } from "@/hooks/useSEO";

// Lazy load MovieGrid as it's below the fold
const MovieGrid = lazy(() => import("@/components/MovieGrid").then(module => ({ default: module.MovieGrid })));

const Index = () => {
  useSEO({
    title: "Home - Discover International Cinema",
    description: "Explore cinematic masterpieces from Japan, France, Italy, Korea and beyond. Discover world cinema classics and build your watchlist.",
    keywords: "world cinema, international films, foreign movies, cinematic masterpieces, film classics",
    canonicalUrl: "https://worldinmovies.com",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "World in Movies",
      "url": "https://worldinmovies.com",
      "description": "Discover and track international cinema masterpieces from around the globe",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://worldinmovies.com/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  });

  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <MovieGrid />
      </Suspense>

      {/* FAQ Section for AEO */}
      <section className="py-16 px-6 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-2">What is World in Movies?</h3>
              <p className="text-muted-foreground">
                World in Movies is a platform for discovering and tracking international cinema masterpieces from around the globe.
                It helps film enthusiasts explore, organize, and remember the best films from different countries and eras.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-2">How do I track movies I've watched?</h3>
              <p className="text-muted-foreground">
                You can add movies to your personal watchlist and mark them as seen. Your watchlist is saved locally
                so you can access it across sessions.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-2">Can I import my existing watchlist?</h3>
              <p className="text-muted-foreground">
                Yes! You can import your watchlist from Trakt.tv using our import feature, making it easy to consolidate
                your movie tracking in one place.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-2">What countries are represented?</h3>
              <p className="text-muted-foreground">
                Our collection includes films from over 50 countries, with special focus on Japan, France, Italy,
                Korea, Sweden, India, Iran, China, and other cinema-rich nations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
