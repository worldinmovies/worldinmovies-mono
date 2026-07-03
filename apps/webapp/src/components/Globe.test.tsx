/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobeMap } from '@/components/Globe';

// Mock react-globe.gl as a placeholder div
vi.mock('react-globe.gl', () => ({
  default: () => <div data-testid="globe">Mock Globe</div>,
}));

// Mock d3-scale
vi.mock('d3-scale', () => ({
  scaleSequentialSqrt: () => {
     
    const fn: any = vi.fn(() => '#fff');
    fn.domain = vi.fn().mockReturnThis();
    return fn;
  },
}));

// Mock d3-scale-chromatic
vi.mock('d3-scale-chromatic', () => ({
  interpolateYlOrRd: () => '#fff',
}));

const mockAvailableCountries = [
  { country: 'Japan', flag: '🇯🇵', countryCode: 'JP' },
  { country: 'France', flag: '🇫🇷', countryCode: 'FR' },
];

describe('GlobeMap', () => {
  const mockOnCountrySelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for GeoJSON
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ features: [] }),
    }));
  });

  it('renders title and globe placeholder', () => {
    render(
      <GlobeMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );
    expect(screen.getByText('Explore Films by Country')).toBeInTheDocument();
    expect(screen.getByTestId('globe')).toBeInTheDocument();
  });

  it('shows country count', () => {
    render(
      <GlobeMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );
    expect(screen.getByText(/2 countries available/)).toBeInTheDocument();
  });

  it('shows selected country when provided', () => {
    render(
      <GlobeMap
        availableCountries={mockAvailableCountries}
        selectedCountry="Japan"
        onCountrySelect={mockOnCountrySelect}
      />,
    );
    expect(screen.getByText('Showing films from')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();
  });

  it('renders legend items', () => {
    render(
      <GlobeMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );
    expect(screen.getByText('Countries with seen movies')).toBeInTheDocument();
    expect(screen.getByText('Countries with unseen movies')).toBeInTheDocument();
  });
});
