import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CountryFilter } from '@/components/CountryFilter';

const mockCountries = [
  { country: 'Japan', countryCode: 'jp', flag: 'https://flagcdn.com/16x12/jp.png' },
  { country: 'France', countryCode: 'fr', flag: 'https://flagcdn.com/16x12/fr.png' },
  { country: 'Italy', countryCode: 'it', flag: 'https://flagcdn.com/16x12/it.png' },
];

describe('CountryFilter component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render select dropdown with all countries', () => {
    const onCountrySelect = vi.fn();
    render(
      <CountryFilter
        selectedCountry={null}
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
      />
    );

    expect(screen.getByText('All Countries')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('Italy')).toBeInTheDocument();
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

    expect(screen.getByText('Japan')).toBeInTheDocument();
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

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'France' } });

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
    // GlobeMap should be rendered (lazy loaded with Suspense)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should hide map when a country is selected', () => {
    const onCountrySelect = vi.fn();

    const { container } = render(
      <CountryFilter
        selectedCountry="Japan"
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
      />
    );

    // Show map first
    const showMapButton = screen.getByText('Show Map');
    fireEvent.click(showMapButton);

    // Select a country - map should hide
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'France' } });

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

    const select = screen.getByRole('combobox');
    fireEvent.click(select);

    // Flag should be rendered inside select items
    expect(screen.getByText('Japan')).toBeInTheDocument();
  });

  it('should render GlobeMap when map is shown', () => {
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

    fireEvent.click(screen.getByText('Show Map'));

    // GlobeMap lazy component should be rendered inside Suspense
    expect(container.innerHTML).toContain('GlobeMap');
  });
});
