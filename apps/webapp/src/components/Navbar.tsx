import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Movie } from "@/lib/models";
import { Device } from "@capacitor/device";

export function Navbar() {
    const [isIOS, setIsIOS] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [seenMovies, setSeenMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const detectPlatform = async () => {
      const info = await Device.getInfo();
      if (info.platform === "ios") {
        setIsIOS(true);
      }
    };
    detectPlatform();

    const loadSeenMovies = () => {
      const saved = localStorage.getItem('seenMovies');
      if (saved) {
        setSeenMovies(JSON.parse(saved));
      }
    };

    loadSeenMovies();

    // Listen to custom event for real-time updates
    const handleSeenChanged = (e: CustomEvent) => {
      setSeenMovies(e.detail);
    };

    window.addEventListener('seenMoviesChanged', handleSeenChanged as EventListener);

    return () => {
      window.removeEventListener('seenMoviesChanged', handleSeenChanged as EventListener);
    };
  }, []);

  const hasSeenMovies = seenMovies.length > 0;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav
      className={cn(
        "sticky z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border",
        isIOS ? "top-20" : "top-0"
      )}
    >
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <Film className="h-6 w-6 text-primary" />
            <span className="font-bold text-base sm:text-xl truncate">World in Movies</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/watchlist" className="text-foreground hover:text-primary transition-colors">
              Watchlist
            </Link>
            {hasSeenMovies && (
              <Link to="/analytics" className="text-foreground hover:text-primary transition-colors">
                Analytics
              </Link>
            )}
            <Link to="/import" className="text-foreground hover:text-primary transition-colors">
              Import
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/admin" className="text-foreground hover:text-primary transition-colors">
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden overflow-y-auto transition-all duration-300 ease-in-out",
          isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="py-4 space-y-3">
            <Link
              to="/"
              className="block px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/watchlist"
              className="block px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Watchlist
            </Link>
            {hasSeenMovies && (
              <Link
                to="/analytics"
                className="block px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Analytics
              </Link>
            )}
            <Link
              to="/import"
              className="block px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Import
            </Link>
            <Link
              to="/about"
              className="block px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/admin"
              className="block px-4 py-2 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          </div>
        </div>
        </div>
      </div>
    </nav>
  );
}