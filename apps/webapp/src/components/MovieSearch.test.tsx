import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MovieSearch } from '@/components/MovieSearch';
import { Movie } from '@/lib/models';

const mockMovies: Movie[] = [
  { id: 1, title: 'Akira', year: 1988, country: 'Japan', director: 'Otomo', rating: 8.5, genres: ['Animation'], poster: '', description: '' },
  { id: 2, title: 'Seven Samurai', year: 1954, country: 'Japan', director: 'Kurosawa', rating: 9.0, genres: ['Drama'], poster: '', description: '' },
];

describe('MovieSearch component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render search input', () => {
    render(<MovieSearch movies={mockMovies} onMovieSelect={() => {}} />);

    expect(screen.getByPlaceholderText(/Search by title/i)).toBeInTheDocument();
  });

  it('should not show suggestions when input is empty', () => {
    render(<MovieSearch movies={mockMovies} onMovieSelect={() => {}} />);

    expect(screen.queryByText(/Akira/i)).not.toBeInTheDocument();
  });

  it('should show suggestions when typing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        hits: [
          { id: 1, title: 'Akira', estimated_country: 'Japan', overview: '', directors: ['Otomo'], weighted_rating: 8.5, guessed_country: 'Japan', original_title: 'Akira', poster: '/akira.jpg', year: '1988' },
        ],
      }),
    }));

    render(<MovieSearch movies={mockMovies} onMovieSelect={() => {}} />);

    const input = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(input, { target: { value: 'Akira' } });

    // Advance timer to trigger debounce
    await waitFor(() => {
      expect(screen.getByText('Akira')).toBeInTheDocument();
    });
  });

  it('should show loading indicator while searching', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})));

    render(<MovieSearch movies={mockMovies} onMovieSelect={() => {}} />);

    const input = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(input, { target: { value: 'Akira' } });

    // Use fake timers
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByLabelText(/loading/i) || screen.getByText(/Searching|loading/i)).toBeInTheDocument();
    });
  });

  it('should call onMovieSelect when a suggestion is clicked', async () => {
    const selectSpy = vi.fn();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        hits: [
          { id: 42, title: 'Akira', estimated_country: 'Japan', overview: '', directors: ['Otomo'], weighted_rating: 8.5, guessed_country: 'Japan', original_title: 'Akira', poster: '/akira.jpg', year: '1988' },
        ],
      }),
    }));

    render(<MovieSearch movies={mockMovies} onMovieSelect={selectSpy} />);

    const input = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(input, { target: { value: 'Akira' } });

    await waitFor(() => {
      expect(screen.getByText('Akira')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Akira'));

    expect(selectSpy).toHaveBeenCalledWith(42);
    expect(input).toHaveValue('');
  });

  it('should close suggestions when clicking outside', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        hits: [{ id: 1, title: 'Akira', estimated_country: 'Japan', overview: '', directors: ['Otomo'], weighted_rating: 8.5, guessed_country: 'Japan', original_title: 'Akira', poster: '/akira.jpg', year: '1988' }],
      }),
    }));

    const { container } = render(<MovieSearch movies={mockMovies} onMovieSelect={() => {}} />);

    const input = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(input, { target: { value: 'Akira' } });

    await waitFor(() => {
      expect(screen.getByText('Akira')).toBeInTheDocument();
    });

    // Click outside
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Akira')).not.toBeInTheDocument();
    });
  });

  it('should sort results by weighted_rating descending', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        hits: [
          { id: 1, title: 'Low Rating', estimated_country: 'Japan', overview: '', directors: ['A'], weighted_rating: 5.0, guessed_country: 'Japan', original_title: 'Low Rating', poster: '/low.jpg', year: '2020' },
          { id: 2, title: 'High Rating', estimated_country: 'Japan', overview: '', directors: ['B'], weighted_rating: 9.0, guessed_country: 'Japan', original_title: 'High Rating', poster: '/high.jpg', year: '2021' },
          { id: 3, title: 'Medium Rating', estimated_country: 'Japan', overview: '', directors: ['C'], weighted_rating: 7.0, guessed_country: 'Japan', original_title: 'Medium Rating', poster: '/medium.jpg', year: '2022' },
        ],
      }),
    }));

    render(<MovieSearch movies={mockMovies} onMovieSelect={() => {}} />);

    const input = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(input, { target: { value: 'Rating' } });

    await waitFor(() => {
      // High rating should appear first
      const items = screen.getAllByText(/Rating/);
      expect(items[0].textContent).toBe('High Rating');
      expect(items[1].textContent).toBe('Medium Rating');
      expect(items[2].textContent).toBe('Low Rating');
    });
  });

  it('should not show suggestions when API returns error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    render(<MovieSearch movies={mockMovies} onMovieSelect={() => {}} />);

    const input = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(input, { target: { value: 'Akira' } });

    await waitFor(() => {
      expect(screen.queryByText(/Akira/)).not.toBeInTheDocument();
    });
  });

  it('should not show suggestions when content-type is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'text/plain' },
      json: async () => ({ hits: [] }),
    }));

    render(<MovieSearch movies={mockMovies} onMovieSelect={() => {}} />);

    const input = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(input, { target: { value: 'Akira' } });

    await waitFor(() => {
      expect(screen.queryByText(/Akira/)).not.toBeInTheDocument();
    });
  });
});
