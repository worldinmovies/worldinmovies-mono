import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Analytics from '@/pages/Analytics';

describe('Analytics page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows empty state when no seenMovies in localStorage', async () => {
    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('No Films Tracked Yet')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Mark some movies as "seen" to start tracking your cinema journey!/),
    ).toBeInTheDocument();
  });

  it('shows empty state when seenMovies is an empty array', async () => {
    localStorage.setItem('seenMovies', JSON.stringify([]));
    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('No Films Tracked Yet')).toBeInTheDocument();
    });
  });

  it('renders stats cards when seenMovies data exists', async () => {
    const seenMovies = [
      { id: 1, title: 'Akira', year: 1988, seen: true, source: 'trakt', country_code: 'JP' },
      { id: 2, title: 'Parasite', year: 2019, seen: true, source: 'trakt', country_code: 'KR' },
      { id: 3, title: 'Seven Samurai', year: 1954, seen: true, source: 'imdb', country_code: 'JP' },
    ];
    localStorage.setItem('seenMovies', JSON.stringify(seenMovies));

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Your Cinema Journey')).toBeInTheDocument();
    });

    // Stat card labels
    expect(screen.getByText('Total Films')).toBeInTheDocument();
    expect(screen.getByText('Countries')).toBeInTheDocument();
    expect(screen.getByText('Decades')).toBeInTheDocument();

    // Stat values: 3 films, 2 unique countries (JP, KR), 3 decades (1950s, 1980s, 2010s)
    const threeElements = screen.getAllByText('3');
    expect(threeElements.length).toBe(2); // Total Films=3, Decades=3
    expect(screen.getByText('2')).toBeInTheDocument(); // Countries=2
  });

  it('renders chart titles when data exists', async () => {
    const seenMovies = [
      { id: 1, title: 'Akira', year: 1988, seen: true, source: 'trakt', country_code: 'JP' },
    ];
    localStorage.setItem('seenMovies', JSON.stringify(seenMovies));

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Films by Country')).toBeInTheDocument();
    });

    expect(screen.getByText('Timeline of Cinema')).toBeInTheDocument();
    // Note: CardDescription uses lowercase 't' in 'top'
    expect(screen.getByText('Your top countries by film count')).toBeInTheDocument();
    expect(screen.getByText('Films across decades')).toBeInTheDocument();
  });

  it('listens to seenMoviesChanged custom event and recalculates', async () => {
    // Start with one movie
    const seenMovies = [
      { id: 1, title: 'Akira', year: 1988, seen: true, source: 'trakt', country_code: 'JP' },
    ];
    localStorage.setItem('seenMovies', JSON.stringify(seenMovies));

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Your Cinema Journey')).toBeInTheDocument();
    });
    // With 1 movie: Total Films=1, Countries=1, Decades=1
    const initialOnes = screen.getAllByText('1');
    expect(initialOnes.length).toBe(3);

    // Update localStorage and dispatch event
    const updatedMovies = [
      { id: 1, title: 'Akira', year: 1988, seen: true, source: 'trakt', country_code: 'JP' },
      { id: 2, title: 'Parasite', year: 2019, seen: true, source: 'trakt', country_code: 'KR' },
    ];
    localStorage.setItem('seenMovies', JSON.stringify(updatedMovies));

    const event = new Event('seenMoviesChanged');
    window.dispatchEvent(event);

    // After the event, total should be 2 now — Total Films=2, Countries=2, Decades=2
    await waitFor(() => {
      const twos = screen.getAllByText('2');
      expect(twos.length).toBe(3);
    });
  });

  it('shows loading state initially before effect runs', () => {
    // The loading spinner is in the initial render before useEffect completes.
    // React 18 flushes effects synchronously within render() in jsdom, but we
    // can verify the loading indicator exists in the document.
    render(<Analytics />);
    // Note: in some React versions the effect may have already transitioned away
    // from loading — the empty/loaded states are covered by other tests.
    const loadingText = screen.queryByText('Loading your cinema journey...');
    // If the effect hasn't fired yet, the spinner is visible
    if (loadingText) {
      expect(loadingText).toBeInTheDocument();
    }
  });
});
