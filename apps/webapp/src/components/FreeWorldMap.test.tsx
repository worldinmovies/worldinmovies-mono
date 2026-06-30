import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FreeWorldMap } from '@/components/FreeWorldMap';

// Mock react-svg-worldmap so it resolves synchronously in tests.
// The mock exposes two click buttons: one for a known country (US) and one
// for an unknown code (XX) so both match and no-match paths are testable.
vi.mock('react-svg-worldmap', () => ({
  default: ({ data, onClickFunction }: { data: Array<{ country: string; value: number; label: string; hasSeen: boolean }>; onClickFunction?: (event: { countryCode: string }) => void }) => (
    <div data-testid="world-map" data-countries={data?.length}>
      {data?.map((d: { country: string; value: number; label: string; hasSeen: boolean }) => (
        <div
          key={d.country}
          data-country={d.country}
          data-value={d.value}
          data-label={d.label}
          data-has-seen={d.hasSeen}
        />
      ))}
      <button onClick={() => onClickFunction?.({ countryCode: 'US' })}>Click US</button>
      <button onClick={() => onClickFunction?.({ countryCode: 'XX' })}>Click XX</button>
    </div>
  ),
}));

const mockAvailableCountries = [
  { country: 'Japan', flag: '🇯🇵', count: 5 },
  { country: 'France', flag: '🇫🇷', count: 3 },
  { country: 'United States', flag: '🇺🇸', count: 2 },
];

describe('FreeWorldMap', () => {
  const mockOnCountrySelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders map with country data', () => {
    render(
      <FreeWorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );

    expect(screen.getByTestId('world-map')).toBeInTheDocument();
    expect(screen.getByText(/3 countries available/)).toBeInTheDocument();
  });

  it('renders section heading', () => {
    render(
      <FreeWorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );

    expect(screen.getByText('Explore Films by Country')).toBeInTheDocument();
  });

  it('clicking an unselected country calls onCountrySelect with the country label', () => {
    render(
      <FreeWorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );

    // "Click US" triggers onClickFunction with { countryCode: 'US' }
    // The component finds 'US' in mapData
    //   (via countryCodeMapping['United States'] = 'US')
    // Since selectedCountry is null, isSelected is false
    //   → calls onCountrySelect('United States')
    fireEvent.click(screen.getByText('Click US'));

    expect(mockOnCountrySelect).toHaveBeenCalledWith('United States');
  });

  it('clicking an already-selected country calls onCountrySelect(null) to deselect', () => {
    render(
      <FreeWorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry="United States"
        onCountrySelect={mockOnCountrySelect}
      />,
    );

    fireEvent.click(screen.getByText('Click US'));

    // isSelected is true because selectedCountry === 'United States'
    //   → calls onCountrySelect(null)
    expect(mockOnCountrySelect).toHaveBeenCalledWith(null);
  });

  it('does not call onCountrySelect when clicking a country not in availableCountries', () => {
    render(
      <FreeWorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );

    // 'XX' doesn't match any country in countryCodeMapping or the fallback
    // (slice(0,2).toUpperCase()), so countryData will be undefined
    fireEvent.click(screen.getByText('Click XX'));

    expect(mockOnCountrySelect).not.toHaveBeenCalled();
  });

  it('shows selected country info text when a country is selected', () => {
    render(
      <FreeWorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry="Japan"
        onCountrySelect={mockOnCountrySelect}
      />,
    );

    expect(screen.getByText(/Showing films from/)).toBeInTheDocument();
    expect(screen.getByText(/Japan/)).toBeInTheDocument();
  });

  it('does not show selected country info when no country is selected', () => {
    render(
      <FreeWorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );

    expect(screen.queryByText(/Showing films from/)).not.toBeInTheDocument();
  });

  it('shows color legend for seen and unseen movies', () => {
    render(
      <FreeWorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );

    expect(screen.getByText('Countries with seen movies')).toBeInTheDocument();
    expect(screen.getByText('Countries with unseen movies')).toBeInTheDocument();
  });
});
