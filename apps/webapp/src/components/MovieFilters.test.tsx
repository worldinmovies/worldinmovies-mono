import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MovieFilters } from '@/components/MovieFilters';
import { Movie } from '@/lib/models';

const mockMovies: Movie[] = [
  { id: 1, title: 'Akira', year: 1988, country: 'Japan', countryCode: 'jp', countryFlag: '', director: 'Otomo', rating: 8.5, genres: ['Animation'], poster: '', description: '' },
];

const mockCountries = [
  { country: 'Japan', countryCode: 'jp', flag: 'https://flagcdn.com/16x12/jp.png' },
  { country: 'France', countryCode: 'fr', flag: 'https://flagcdn.com/16x12/fr.png' },
];

describe('MovieFilters component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render country filter with All Countries placeholder', () => {
    const onCountrySelect = vi.fn();
    render(
      <MovieFilters
        selectedCountry={null}
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
        seenMovies={[]}
        movies={mockMovies}
        seenFilter="all"
        onSeenFilterChange={() => {}}
        watchlistFilter="all"
        onWatchlistFilterChange={() => {}}
        uniqueWatchlistTags={['all']}
        genreFilter="all"
        onGenreFilterChange={() => {}}
        uniqueGenres={['all', 'Animation']}
      />
    );

    expect(screen.getByText('All Countries')).toBeInTheDocument();
    // Country items are in the Radix Select dropdown (portal) - not visible until opened
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render watchlist filter dropdown trigger', () => {
    const onWatchlistFilterChange = vi.fn();
    render(
      <MovieFilters
        selectedCountry={null}
        onCountrySelect={() => {}}
        availableCountries={mockCountries}
        seenMovies={[]}
        movies={mockMovies}
        seenFilter="all"
        onSeenFilterChange={() => {}}
        watchlistFilter="all"
        onWatchlistFilterChange={onWatchlistFilterChange}
        uniqueWatchlistTags={['all', 'watchlist']}
        genreFilter="all"
        onGenreFilterChange={() => {}}
        uniqueGenres={['all', 'Animation']}
      />
    );

    // "All Movies" is the trigger text when watchlistFilter is 'all'
    expect(screen.getByText('All Movies')).toBeInTheDocument();
  });

  it('should render seen filter dropdown trigger', () => {
    const onSeenFilterChange = vi.fn();
    render(
      <MovieFilters
        selectedCountry={null}
        onCountrySelect={() => {}}
        availableCountries={mockCountries}
        seenMovies={[]}
        movies={mockMovies}
        seenFilter="seen"
        onSeenFilterChange={onSeenFilterChange}
        watchlistFilter="all"
        onWatchlistFilterChange={() => {}}
        uniqueWatchlistTags={['all']}
        genreFilter="all"
        onGenreFilterChange={() => {}}
        uniqueGenres={['all', 'Animation']}
      />
    );

    expect(screen.getByText('Seen')).toBeInTheDocument();
  });

  it('should render genre filter dropdown trigger', () => {
    const onGenreFilterChange = vi.fn();
    render(
      <MovieFilters
        selectedCountry={null}
        onCountrySelect={() => {}}
        availableCountries={mockCountries}
        seenMovies={[]}
        movies={mockMovies}
        seenFilter="all"
        onSeenFilterChange={() => {}}
        watchlistFilter="all"
        onWatchlistFilterChange={() => {}}
        uniqueWatchlistTags={['all']}
        genreFilter="Animation"
        onGenreFilterChange={onGenreFilterChange}
        uniqueGenres={['all', 'Animation', 'Drama']}
      />
    );

    expect(screen.getByText('Animation')).toBeInTheDocument();
  });

  it('should call country filter callback when country selected', () => {
    const onCountrySelect = vi.fn();

    render(
      <MovieFilters
        selectedCountry={null}
        onCountrySelect={onCountrySelect}
        availableCountries={mockCountries}
        seenMovies={[]}
        movies={mockMovies}
        seenFilter="all"
        onSeenFilterChange={() => {}}
        watchlistFilter="all"
        onWatchlistFilterChange={() => {}}
        uniqueWatchlistTags={['all']}
        genreFilter="all"
        onGenreFilterChange={() => {}}
        uniqueGenres={['all', 'Animation']}
      />
    );

    // Open country dropdown (Radix Select)
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    // Select France
    const franceOption = screen.getByRole('option', { name: /France/i });
    fireEvent.click(franceOption);

    expect(onCountrySelect).toHaveBeenCalledWith('France');
  });

  it('should display selected filter labels correctly', () => {
    render(
      <MovieFilters
        selectedCountry="Japan"
        onCountrySelect={() => {}}
        availableCountries={mockCountries}
        seenMovies={[]}
        movies={mockMovies}
        seenFilter="seen"
        onSeenFilterChange={() => {}}
        watchlistFilter="custom-tag"
        onWatchlistFilterChange={() => {}}
        uniqueWatchlistTags={['all', 'custom-tag']}
        genreFilter="Animation"
        onGenreFilterChange={() => {}}
        uniqueGenres={['all', 'Animation']}
      />
    );

    // Japan appears in both the select trigger and the "Showing films from:" section
    const japanElements = screen.getAllByText('Japan');
    expect(japanElements.length).toBe(2);
    expect(screen.getByText('Seen')).toBeInTheDocument();
    expect(screen.getByText('Custom Tag')).toBeInTheDocument();
    expect(screen.getByText('Animation')).toBeInTheDocument();
  });

  it('should have all filter trigger buttons rendered', () => {
    render(
      <MovieFilters
        selectedCountry={null}
        onCountrySelect={() => {}}
        availableCountries={mockCountries}
        seenMovies={[]}
        movies={mockMovies}
        seenFilter="all"
        onSeenFilterChange={() => {}}
        watchlistFilter="all"
        onWatchlistFilterChange={() => {}}
        uniqueWatchlistTags={['all']}
        genreFilter="all"
        onGenreFilterChange={() => {}}
        uniqueGenres={['all', 'Animation']}
      />
    );

    // Verify all four filter buttons are present
    expect(screen.getByText('All Countries')).toBeInTheDocument();
    expect(screen.getByText('All Movies')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument(); // Seen filter trigger (seenFilter='all')
    expect(screen.getByText('All Genres')).toBeInTheDocument();
  });
});
