import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import Globe from "react-globe.gl";
import { scaleSequentialSqrt } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import { Movie } from "@/lib/models";

interface FreeWorldMapProps {
  availableCountries: Array<{ country: string; flag: string; countryCode: string }>;
  selectedCountry: string | null;
  onCountrySelect: (country: string | null) => void;
  seenMovies?: Movie[];
  movies?: Array<{ id: number; country: string }>;
}

export const GlobeMap = ({
  availableCountries,
  selectedCountry,
  onCountrySelect,
  seenMovies,
  movies = [],
}: FreeWorldMapProps) => {
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState();

  useEffect(() => {
    // load data
    fetch("/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then(setCountries);
  }, []);

  const colorScale = scaleSequentialSqrt(interpolateYlOrRd);

  // GDP per capita (avoiding countries with small pop)
  const getVal = (feat) =>
    feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);

  const maxVal = useMemo(
    () => Math.max(...countries.features.map(getVal)),
    [countries],
  );
  colorScale.domain([0, maxVal]);

  // Check if any movies from a country have been seen
  const hasSeenMoviesFromCountry = (country: string) => {
    return movies.some(
      (movie) => movie.country === country && seenMovies.find(a => a.id === movie.id),
    );
  };

  // Prepare data for react-svg-worldmap
  const mapData = useMemo(() => {
    return availableCountries.map(({ country, countryCode }) => ({
      country: country,
      value: 0,
      label: country,
      hasSeen: hasSeenMoviesFromCountry(country),
    }));
  }, [availableCountries, seenMovies, movies]);

  // Prepare data for react-svg-worldmap
  return (
    <Card className="overflow-hidden bg-card border-border">
      <div className="relative p-3 md:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Explore Films by Country
        </h3>
        <div className="relative bg-gradient-to-br from-slate-900/20 to-slate-800/20 rounded-lg p-2 md:p-4 h-[300px] md:h-[500px] mx-auto max-w-full flex items-center justify-center">
          <Globe
            width={typeof window !== 'undefined' && window.innerWidth < 768 ? window.innerWidth - 64 : 800}
            height={typeof window !== 'undefined' && window.innerWidth < 768 ? 300 : 500}
            //globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
            globeImageUrl="//images.unsplash.com/photo-1614850523011-8f49ffc73908?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
            lineHoverPrecision={0}
            polygonsData={countries.features.filter(
              (d) => d.properties.ISO_A2 !== "AQ",
            )}
            polygonAltitude={(d) => (d === hoverD ? 0.02 : 0.01)}
            polygonCapColor={(d: any) => {
              if (d === hoverD) return "steelblue";
              
              const countryName = d.properties.ADMIN;
              const countryData = availableCountries.find(c => 
                c.country.toLowerCase() === countryName.toLowerCase() ||
                c.country.includes(countryName) ||
                countryName.includes(c.country)
              );
              
              if (countryData && hasSeenMoviesFromCountry(countryData.country)) {
                return "#10b981"; // Green for countries with seen movies
              } else if (countryData) {
                return "#3b82f6"; // Blue for countries with available movies
              }
              
              return colorScale(getVal(d)).toString();
            }}
            polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
            polygonStrokeColor={() => "#111"}
            polygonLabel={(d: any) => {
              const properties = d.properties;
              return `<div style="background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                <strong>${properties.ADMIN}</strong>
              </div>`;
            }}
            onPolygonClick={(polygon: any) => {
              const countryName = polygon.properties.ADMIN;
              const countryData = availableCountries.find(c => 
                c.country.toLowerCase() === countryName.toLowerCase() ||
                c.country.includes(countryName) ||
                countryName.includes(c.country)
              );
              if (countryData) {
                onCountrySelect(countryData.country);
              }
            }}
            onPolygonHover={setHoverD}
            polygonsTransitionDuration={300}
          />
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-center flex justify-center">
            <p className="text-sm text-muted-foreground">
              Click on countries to filter films • {availableCountries.length}{" "}
              countries available
            </p>
            {selectedCountry && (
              <div className="flex items-center gap-2 text-sm text-cinema-silver">
                <span>Showing films from </span>
                <img
                  src={availableCountries.find((c) => c.country === selectedCountry)
                    ?.flag}
                  alt={"country"}
                  style={{ width: 14, height: 14, marginRight: 0 }}
                />
                <span>{selectedCountry}</span>
              </div>
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
