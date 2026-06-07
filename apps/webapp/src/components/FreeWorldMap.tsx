import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import WorldMap from 'react-svg-worldmap';

interface FreeWorldMapProps {
  availableCountries: Array<{ country: string; flag: string; count: number }>;
  selectedCountry: string | null;
  onCountrySelect: (country: string | null) => void;
  seenMovies?: Set<number>;
  movies?: Array<{ id: number; country: string; }>;
}

export const FreeWorldMap = ({ availableCountries, selectedCountry, onCountrySelect, seenMovies = new Set(), movies = [] }: FreeWorldMapProps) => {
  // Country code mapping for react-svg-worldmap
  const countryCodeMapping: Record<string, string> = {
    'United States': 'US',
    'United Kingdom': 'GB',
    'France': 'FR',
    'Germany': 'DE',
    'Italy': 'IT',
    'Spain': 'ES',
    'Japan': 'JP',
    'China': 'CN',
    'India': 'IN',
    'South Korea': 'KR',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Russia': 'RU',
    'Sweden': 'SE',
    'Austria': 'AT',
    'Iran': 'IR'
  };

  // Check if any movies from a country have been seen
  const hasSeenMoviesFromCountry = (country: string) => {
    return movies.some(movie => movie.country === country && seenMovies.has(movie.id));
  };

  // Prepare data for react-svg-worldmap
  const mapData = useMemo(() => {
    return availableCountries.map(({ country, count }) => ({
      country: countryCodeMapping[country] || country.slice(0, 2).toUpperCase(),
      value: count,
      label: country,
      hasSeen: hasSeenMoviesFromCountry(country)
    }));
  }, [availableCountries, seenMovies, movies]);

  return (
    <Card className="overflow-hidden bg-card border-border">
      <div className="relative p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Explore Films by Country</h3>
        <div className="relative bg-gradient-to-br from-slate-900/20 to-slate-800/20 rounded-lg p-4">
          <WorldMap
            color="hsl(var(--primary))"
            title="Movie Countries"
            value-suffix="movies"
            size="xl"
            data={mapData}
            onClickFunction={(event: any) => {
              const countryData = mapData.find(d => d.country === event.countryCode);
              if (countryData) {
                const isSelected = selectedCountry === countryData.label;
                onCountrySelect(isSelected ? null : countryData.label);
              }
            }}
            styleFunction={(context: any) => {
              const isSelected = selectedCountry === context.countryValue?.label;
              const hasSeen = context.countryValue?.hasSeen;
              
              if (isSelected) {
                return {
                  fill: "hsl(var(--cinema-gold))",
                  fillOpacity: 1,
                  stroke: "hsl(var(--cinema-gold))",
                  strokeWidth: 2,
                  strokeOpacity: 1,
                  cursor: "pointer"
                };
              }
              
              if (context.countryValue) {
                return {
                  fill: hasSeen ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  fillOpacity: hasSeen ? 0.8 : 0.6,
                  stroke: "hsl(var(--border))",
                  strokeWidth: 1,
                  strokeOpacity: 0.8,
                  cursor: "pointer"
                };
              }
              
              return {
                fill: "hsl(var(--muted-foreground))",
                fillOpacity: 0.2,
                stroke: "hsl(var(--border))",
                strokeWidth: 0.5,
                strokeOpacity: 0.3,
                cursor: "default"
              };
            }}
          />
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Click on countries to filter films • {availableCountries.length} countries available
            </p>
            {selectedCountry && (
              <p className="text-sm text-cinema-gold mt-2">
                Showing films from {availableCountries.find(c => c.country === selectedCountry)?.flag} {selectedCountry}
              </p>
            )}
          </div>
          
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary opacity-80"></div>
              <span>Countries with seen movies</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-muted opacity-60"></div>
              <span>Countries with unseen movies</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};