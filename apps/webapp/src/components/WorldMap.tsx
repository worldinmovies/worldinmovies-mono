import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface WorldMapProps {
  availableCountries: Array<{ country: string; flag: string; count: number }>;
  selectedCountry: string | null;
  onCountrySelect: (country: string | null) => void;
}

export const WorldMap = ({ availableCountries, selectedCountry, onCountrySelect }: WorldMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [map, setMap] = useState<mapboxgl.Map>(null);

  useEffect(() => {
    if (showTokenInput || !mapboxToken || !mapContainer.current) return;

    const initializeMap = async () => {
      try {
        // Dynamically import mapbox-gl
        const mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');

        mapboxgl.accessToken = mapboxToken;
        
        const newMap = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          zoom: 1.5,
          center: [20, 20],
          projection: 'globe'
        });

        newMap.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );

        newMap.on('style.load', () => {
          newMap.setFog({
            color: 'rgb(30, 30, 40)',
            'high-color': 'rgb(50, 50, 70)',
            'horizon-blend': 0.1,
          });
        });

        // Add country markers
        availableCountries.forEach(({ country, flag, count }) => {
          // Simple country coordinates (you'd want a proper mapping in production)
          const coordinates = getCountryCoordinates(country);
          if (coordinates) {
            const el = document.createElement('div');
            el.className = 'country-marker';
            el.innerHTML = `
              <div class="flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
                <div class="text-2xl mb-1 ${selectedCountry === country ? 'ring-2 ring-cinema-gold rounded-full p-1' : ''}">${flag}</div>
                <div class="text-xs text-white bg-black/70 px-2 py-1 rounded whitespace-nowrap">${count} films</div>
              </div>
            `;
            
            el.addEventListener('click', () => {
              onCountrySelect(selectedCountry === country ? null : country);
            });

            new mapboxgl.Marker(el)
              .setLngLat(coordinates)
              .addTo(newMap);
          }
        });

        setMap(newMap);
        setShowTokenInput(false);

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [mapboxToken, showTokenInput, availableCountries, selectedCountry, onCountrySelect]);

  // Simple country coordinates mapping (in production, use a proper geolocation service)
  const getCountryCoordinates = (country: string): [number, number] | null => {
    const coordinates: Record<string, [number, number]> = {
      'Japan': [138.2529, 36.2048],
      'Italy': [12.5674, 41.8719],
      'France': [2.2137, 46.2276],
      'Sweden': [18.6435, 60.1282],
      'India': [78.9629, 20.5937],
      'South Korea': [127.7669, 35.9078],
      'Austria': [14.5501, 47.5162],
      'United States': [-95.7129, 37.0902],
      'Germany': [10.4515, 51.1657],
      'United Kingdom': [-3.4360, 55.3781],
      'Spain': [-3.7492, 40.4637],
      'Russia': [105.3188, 61.5240],
      'China': [104.1954, 35.8617],
      'Brazil': [-51.9253, -14.2350],
      'Iran': [53.6880, 32.4279],
      'Mexico': [-102.5528, 23.6345]
    };
    return coordinates[country] || null;
  };

  if (showTokenInput) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Enable Interactive World Map</h3>
          <p className="text-sm text-muted-foreground">
            Enter your Mapbox public token to explore films by country on an interactive map.
            Get your token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-cinema-gold underline">mapbox.com</a>
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => setShowTokenInput(false)}
              disabled={!mapboxToken.startsWith('pk.')}
            >
              Load Map
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your token is only stored locally and is not sent to our servers.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-card border-border">
      <div className="relative">
        <div ref={mapContainer} className="h-96 w-full" />
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
          <p className="text-sm text-white">
            Click country flags to filter films
          </p>
        </div>
      </div>
    </Card>
  );
};