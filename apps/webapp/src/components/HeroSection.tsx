import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-foreign-cinema.jpg";

export const HeroSection = () => {
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    const viewed = localStorage.getItem('heroViewed');
    if (viewed) {
      setHasViewed(true);
    } else {
      localStorage.setItem('heroViewed', 'true');
    }
  }, []);

  if (hasViewed) {
    return null;
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-accent bg-clip-text text-transparent">
          Discover Cinema
          <br />
          <span className="text-foreground">Without Borders</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-cinema-silver mb-8 max-w-3xl mx-auto leading-relaxed">
          From Kurosawa's samurai epics to Fellini's surreal dreams. From Bergman's existential meditations 
          to Ozu's quiet poetry. Experience the masterworks that transcend language and culture.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
          <div className="flex items-center gap-2 text-cinema-gold">
            <span className="text-2xl">🎬</span>
            <span className="text-lg font-medium">Seven Samurai to Parasite</span>
          </div>
          <div className="flex items-center gap-2 text-cinema-gold">
            <span className="text-2xl">🌍</span>
            <span className="text-lg font-medium">50+ Countries</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-cinema-silver/80 max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-cinema-gold">Japan</span>
            <span>Kurosawa • Ozu • Mizoguchi</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-cinema-gold">Italy</span>
            <span>Fellini • Visconti • Antonioni</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-cinema-gold">France</span>
            <span>Godard • Truffaut • Renoir</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-cinema-gold">Sweden</span>
            <span>Bergman • Sjöström • Andersson</span>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-cinema-silver animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm">Explore Films</span>
          <div className="w-px h-8 bg-gradient-to-b from-cinema-gold to-transparent"></div>
        </div>
      </div>
    </section>
  );
};