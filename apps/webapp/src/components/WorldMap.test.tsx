import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldMap } from '@/components/WorldMap';

const mockAvailableCountries = [
  { country: 'Japan', flag: '🇯🇵', count: 5 },
  { country: 'France', flag: '🇫🇷', count: 3 },
];

describe('WorldMap', () => {
  const mockOnCountrySelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders token input by default', () => {
    render(
      <WorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );
    expect(screen.getByText('Enable Interactive World Map')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('pk.eyJ1...')).toBeInTheDocument();
    expect(screen.getByText('Load Map')).toBeInTheDocument();
  });

  it('disables Load Map button without valid token', () => {
    render(
      <WorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );
    expect(screen.getByText('Load Map')).toBeDisabled();
  });

  it('enables Load Map button with valid token prefix', () => {
    render(
      <WorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );
    const input = screen.getByPlaceholderText('pk.eyJ1...');
    fireEvent.change(input, { target: { value: 'pk.test_token' } });
    expect(screen.getByText('Load Map')).not.toBeDisabled();
  });

  it('renders Mapbox link', () => {
    render(
      <WorldMap
        availableCountries={mockAvailableCountries}
        selectedCountry={null}
        onCountrySelect={mockOnCountrySelect}
      />,
    );
    const link = screen.getByText('mapbox.com');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://mapbox.com');
  });
});
