import { useSEO } from "@/hooks/useSEO";

const About = () => {
  useSEO({
    title: "About - World in Movies",
    description: "Learn about World in Movies - a platform dedicated to discovering and tracking international cinema masterpieces from around the globe.",
    keywords: "about world in movies, international cinema platform, world cinema tracker",
    canonicalUrl: "https://worldinmovies.com/about",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "World in Movies",
      "description": "Discover and track international cinema masterpieces from around the globe",
      "url": "https://worldinmovies.com",
      "sameAs": []
    }
  });

  return (
    <main className="min-h-screen bg-background">
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-accent bg-clip-text text-transparent">
              About World in Movies
            </h1>
            <p className="text-xl text-cinema-silver max-w-2xl mx-auto">
              A passion project for film enthusiasts who believe cinema has no borders.
            </p>
          </div>

          <div className="space-y-8 text-foreground/90">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p className="mb-4">
                World in Movies was created to help film lovers discover, organize, and remember the cinematic masterpieces
                from around the world. From Kurosawa's Seven Samurai to Bong Joon-ho's Parasite, great cinema transcends
                language and culture — and we want to help you explore it all.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Curated Collection</strong> — Hand-picked films from over 50 countries</li>
                <li><strong>Personal Watchlist</strong> — Track movies you want to watch and those you've seen</li>
                <li><strong>Country Filtering</strong> — Explore cinema by country of origin</li>
                <li><strong>Import Support</strong> — Bring your Trakt.tv watchlist for consolidation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Why World Cinema?</h2>
              <p className="mb-4">
                International cinema offers perspectives that domestic films often can't. From the poetic realism of
                French New Wave to the existential depth of Bergman, from the visual poetry of Ozu to the social commentary
                of Iranian cinema — every country brings its own unique voice to the art form.
              </p>
              <p>
                We believe that every film lover should experience cinema beyond their native language, and World in Movies
                is here to make that journey easier.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
              <p>
                Have feedback, suggestions, or just want to talk about films? We'd love to hear from you.
                Reach out through our contact page or share your thoughts on social media.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
