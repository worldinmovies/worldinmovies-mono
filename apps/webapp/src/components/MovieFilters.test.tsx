import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MovieFilters } from '@/components/MovieFilters';
import { Movie } from '@/lib/models';

const mockMovies: Movie[] = [
  { id: 1, title: 'Akira', year: 1988, country: 'Japan', director: 'Otomo', rating: 8.5, genres: ['Animation'], poster: '', description: '' },
];

const mockCountries = [
  { country: 'Japan', countryCode: 'jp', flag: 'https://flagcdn.com/16x12/jp.png' },
  { country: 'France', countryCode: 'fr', flag: 'https://flagcdn.com/16x12/fr.png' },
];

describe('MovieFilters component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render country filter', () => {
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
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  it('should render watchlist filter dropdown', () => {
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

    expect(screen.getByText('All Movies')).toBeInTheDocument();
    expect(screen.getByText('In Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
  });

  it('should render seen filter dropdown', () => {
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

    expect(screen.getByText('Seen Movies')).toBeInTheDocument();
    expect(screen.getByText('Unseen Movies')).toBeInTheDocument();
  });

  it('should render genre filter dropdown', () => {
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
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('All Genres')).toBeInTheDocument();
  });

  it('should call country filter callback when country selected', () => {
    const onCountrySelect = vi.fn();

    const { container } = render(
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

    // Open country dropdown
    const countryDropdown = container.querySelector('[role="combobox"]');
    if (countryDropdown) {
      fireEvent.click(countryDropdown);
      fireEvent.change(countryDropdown, { target: { value: 'France' } });
      expect(onCountrySelect).toHaveBeenCalledWith('France');
    }
  });

  it('should call seen filter callback when filter changed', () => {
    const onSeenFilterChange = vi.fn();

    const { container } = render(
      <MovieFilters
        selectedCountry={null}
        onCountrySelect={() => {}}
        availableCountries={mockCountries}
        seenMovies={[]}
        movies={mockMovies}
        seenFilter="all"
        onSeenFilterChange={onSeenFilterChange}
        watchlistFilter="all"
        onWatchlistFilterChange={() => {}}
        uniqueWatchlistTags={['all']}
        genreFilter="all"
        onGenreFilterChange={() => {}}
        uniqueGenres={['all', 'Animation']}
      />
    );

    // Open seen filter dropdown
    const seenDropdown = container.querySelectorAll('[role="menu"]')[0];
    if (seenDropdown) {
      fireEvent.click(seenDropdown);
      const seenItem = screen.getByText('Seen Movies');
      fireEvent.click(seenItem);
      expect(onSeenFilterChange).toHaveBeenCalledWith('seen');
    }
  });

  it('should call watchlist filter callback when filter changed', () => {
    const onWatchlistFilterChange = vi.fn();

    const { container } = render(
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

    // Open watchlist filter dropdown
    const watchlistDropdown = container.querySelectorAll('[role="menu"]')[1];
    if (watchlistDropdown) {
      fireEvent.click(watchlistDropdown);
      const inWatchlistItem = screen.getByText('In Watchlist');
      fireEvent.click(inWatchlistItem);
      expect(onWatchlistFilterChange).toHaveBeenCalledWith('any');
    }
  });

  it('should call genre filter callback when genre selected', () => {
    const onGenreFilterChange = vi.fn();

    const { container } = render(
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
        onGenreFilterChange={onGenreFilterChange}
        uniqueGenres={['all', 'Animation', 'Drama']}
      />
    );

    // Open genre filter dropdown
    const genreDropdown = container.querySelectorAll('[role="menu"]')[2];
    if (genreDropdown) {
      fireEvent.click(genreDropdown);
      const animationItem = screen.getByText('Animation');
      fireEvent.click(animationItem);
      expect(onGenreFilterChange).toHaveBeenCalledWith('Animation');
    }
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

    // Check that selected filter labels are displayed
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('Seen')).toBeInTheDocument();
    expect(screen.getByText('Custom Tag')).toBeInTheDocument();
    expect(screen.getByText('Animation')).toBeInTheDocument();
  });
});
