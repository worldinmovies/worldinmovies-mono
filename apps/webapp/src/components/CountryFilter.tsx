import { useState, lazy, Suspense } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Globe, Map } from "lucide-react";
import { Movie } from "@/lib/models";
import { Flag } from "./Flag";

// Lazy load the globe map component
const GlobeMap = lazy(() => import("./Globe").then(module => ({ default: module.GlobeMap })));

interface CountryFilterProps {
  selectedCountry: string | null;
  onCountrySelect: (country: string | null) => void;
  availableCountries: Array<{ country: string; flag: string; countryCode: string }>;
  seenMovies?: Movie[];
  movies?: Array<Movie>;
  onCountryChange?: (countryCode: string | null) => void;
}

export const CountryFilter = ({
  selectedCountry,
  onCountrySelect,
  availableCountries,
  seenMovies,
  movies,
  onCountryChange,
}: CountryFilterProps) => {
  
  const handleCountrySelect = (country: string | null) => {
    onCountrySelect(country);
    if (onCountryChange) {
      const countryData = availableCountries.find(c => c.country === country);
      onCountryChange(countryData?.countryCode || null);
    }
    if (country) {
      setShowMap(false); // Hide map after selecting a country
    }
  };
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cinema-gold" />
          <span className="text-lg font-semibold text-foreground">
            Explore by Country
          </span>
        </div>

        <div className="flex gap-2">
          <Select
            value={selectedCountry || "all"}
            onValueChange={(value) =>
              handleCountrySelect(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-48 bg-card border-border">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {availableCountries?.map(({ country, countryCode }) => (
                <SelectItem key={country} value={country}>
                  <div className="flex items-center gap-2">
                    <Flag countryCode={countryCode} alt={country}/>
                    <span>{country}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2"
          >
            <Map className="w-4 h-4" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
        </div>
      </div>

      {showMap && (
        <div>
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <GlobeMap
              availableCountries={availableCountries}
              selectedCountry={selectedCountry}
              onCountrySelect={handleCountrySelect}
              seenMovies={seenMovies}
              movies={movies}
            />
          </Suspense>
        </div>
      )}

      {selectedCountry && (
        <div className="flex items-center gap-2 text-sm text-cinema-silver">
          <span>Showing films from:</span>
          <span className="text-foreground font-medium flex items-center gap-2">
            {availableCountries.find((c) => c.country === selectedCountry)?.countryCode && (
              <Flag 
                countryCode={availableCountries.find((c) => c.country === selectedCountry)!.countryCode} 
                alt={selectedCountry}
              />
            )}
            {selectedCountry}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCountrySelect(null)}
            className="text-xs underline"
          >
            Clear filter
          </Button>
        </div>
      )}
    </div>
  );
};
