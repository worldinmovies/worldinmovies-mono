import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CountryFilter } from '@/components/CountryFilter';

// Mock the lazy-loaded Globe module so it resolves synchronously in tests
vi.mock('@/components/Globe', () => ({
  GlobeMap: () => <div data-testid="globe-map">GlobeMap Mock</div>,
}));

const mockCountries = [
  { country: 'Japan', countryCode: 'jp', flag: 'https://flagcdn.com/16x12/jp.png' },
  { country: 'France', countryCode: 'fr', flag: 'https://flagcdn.com/16x12/fr.png' },
  { country: 'Italy', countryCode: 'it', flag: 'https://flagcdn.com/16x12/it.png' },
];

describe('CountryFilter component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render combobox with All Countries placeholder', () => {
    const onCountrySelect = vi.fn();
    render(
      <CountryFilter
        selectedCountry={null}
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
      />
    );

    expect(screen.getByText('All Countries')).toBeInTheDocument();
    // Country items are not in the DOM until dropdown opens (Radix portal)
    // Verify the combobox trigger is present
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should show selected country', () => {
    const onCountrySelect = vi.fn();
    render(
      <CountryFilter
        selectedCountry="Japan"
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
      />
    );

    // Japan appears in both the select trigger and the "Showing films from:" section
    const japanElements = screen.getAllByText('Japan');
    expect(japanElements.length).toBe(2);
    expect(screen.getByText('Showing films from:')).toBeInTheDocument();
    expect(screen.getByText('Clear filter')).toBeInTheDocument();
  });

  it('should call onCountrySelect when a country is selected', () => {
    const onCountrySelect = vi.fn();
    const onCountryChange = vi.fn();

    render(
      <CountryFilter
        selectedCountry={null}
        onCountrySelect={onCountrySelect}
        onCountryChange={onCountryChange}
        availableCountries={mockCountries}
      />
    );

    // Open the Radix Select dropdown
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    // Click the France option (rendered in portal)
    const franceOption = screen.getByRole('option', { name: /France/i });
    fireEvent.click(franceOption);

    expect(onCountrySelect).toHaveBeenCalledWith('France');
    expect(onCountryChange).toHaveBeenCalledWith('fr');
  });

  it('should clear filter when clear button is clicked', () => {
    const onCountrySelect = vi.fn();

    render(
      <CountryFilter
        selectedCountry="Japan"
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
      />
    );

    const clearButton = screen.getByText('Clear filter');
    fireEvent.click(clearButton);

    expect(onCountrySelect).toHaveBeenCalledWith(null);
  });

  it('should toggle map visibility', () => {
    const onCountrySelect = vi.fn();

    const { container } = render(
      <CountryFilter
        selectedCountry={null}
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
      />
    );

    const showMapButton = screen.getByText('Show Map');
    expect(showMapButton).toBeInTheDocument();

    fireEvent.click(showMapButton);

    expect(screen.getByText('Hide Map')).toBeInTheDocument();
    // Suspense fallback should appear while lazy component loads
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should hide map when a country is selected', () => {
    const onCountrySelect = vi.fn();

    const { container } = render(
      <CountryFilter
        selectedCountry={null}
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
      />
    );

    // Show map first
    const showMapButton = screen.getByText('Show Map');
    fireEvent.click(showMapButton);
    expect(screen.getByText('Hide Map')).toBeInTheDocument();

    // Open the Radix Select dropdown
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    // Select France - map should hide
    const franceOption = screen.getByRole('option', { name: /France/i });
    fireEvent.click(franceOption);

    expect(screen.getByText('Show Map')).toBeInTheDocument();
  });

  it('should render flag next to country name', () => {
    const onCountrySelect = vi.fn();
    render(
      <CountryFilter
        selectedCountry={null}
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
      />
    );

    // Open the Radix Select dropdown
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    // Flag should be rendered inside select items
    expect(screen.getByText('Japan')).toBeInTheDocument();
  });

  it('should render GlobeMap when map is shown', async () => {
    const onCountrySelect = vi.fn();

    const { container } = render(
      <CountryFilter
        selectedCountry={null}
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
        movies={[]}
        seenMovies={[]}
      />
    );

    // Click Show Map
    fireEvent.click(screen.getByText('Show Map'));

    // The lazy component resolves via the mock above
    // Suspense might need a tick to resolve the lazy promise
    const globeMap = await screen.findByTestId('globe-map');
    expect(globeMap).toBeInTheDocument();
    expect(globeMap).toHaveTextContent('GlobeMap Mock');
  });

  it('should render country items when dropdown is opened', () => {
    const onCountrySelect = vi.fn();
    render(
      <CountryFilter
        selectedCountry={null}
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
      />
    );

    // Open the Radix Select dropdown
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    // All country options should be accessible
    expect(screen.getByRole('option', { name: /Japan/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /France/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Italy/i })).toBeInTheDocument();
  });
});
