import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImdbImport } from './ImdbComponent';

const mockAddToLog = vi.fn();
const mockSetIsImporting = vi.fn();

const renderImdbImport = (isImporting = false) => {
  return render(
    <ImdbImport
      isImporting={isImporting}
      setIsImporting={mockSetIsImporting}
      addToLog={mockAddToLog}
    />
  );
};

const createFakeFile = () => {
  return new File(['title,rating'], 'ratings.csv', { type: 'text/csv' });
};

describe('ImdbImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // No global cleanup needed — each test creates its own fetch mock
    // via vi.stubGlobal, which safely overwrites the previous one.
    // vi.unstubAllGlobals() would destroy the localStorage mock from setup.tsx.
  });

  it('renders import card with title, file input, and button', () => {
    renderImdbImport();

    const imdbHeadings = screen.getAllByText('Import from IMDb');
    expect(imdbHeadings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Select IMDb Export File')).toBeTruthy();
    expect(screen.getByRole('button', { name: /import from imdb/i })).toBeTruthy();
  });

  it('import button is disabled without file', () => {
    renderImdbImport();

    const button = screen.getByRole('button', { name: /import from imdb/i });
    expect(button).toBeDisabled();
  });

  it('import button is disabled during import', () => {
    renderImdbImport(true);

    const button = screen.getByRole('button', { name: /importing/i });
    expect(button).toBeDisabled();
  });

  it('triggers fetch on import with selected file', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ found: {}, not_found: [] }),
      })
    ));

    renderImdbImport();

    const fileInput = screen.getByLabelText('Select IMDb Export File');
    await fireEvent.change(fileInput, { target: { files: [createFakeFile()] } });

    const button = screen.getByRole('button', { name: /import from imdb/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith('/tmdb/imdb/ratings', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('updates localStorage with imported movies on success', async () => {
    const mockMovie = {
      imdb_id: 'tt001',
      id: 1,
      original_title: 'Test Movie',
      release_date: '2020-01-15',
      poster_path: '/test.jpg',
      vote_average: 7.5,
      vote_count: 100,
      country_code: 'US',
    };

    const responseBody = { found: { group1: [mockMovie] }, not_found: [] };
    vi.stubGlobal('fetch', vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responseBody),
      })
    ));

    renderImdbImport();

    const fileInput = screen.getByLabelText('Select IMDb Export File');
    await fireEvent.change(fileInput, { target: { files: [createFakeFile()] } });

    const button = screen.getByRole('button', { name: /import from imdb/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockAddToLog).toHaveBeenCalledWith(expect.stringContaining('1 movies'));
    });

    const stored = JSON.parse(localStorage.getItem('seenMovies') || '[]');
    expect(stored.length).toBeGreaterThan(0);
  });

  it('displays status card after successful import', async () => {
    const mockMovie = {
      imdb_id: 'tt002',
      id: 2,
      original_title: 'Status Movie',
      release_date: '2022-06-20',
      poster_path: '/status2.jpg',
      vote_average: 8.0,
      vote_count: 200,
      country_code: 'GB',
    };

    const responseBody = { found: { group1: [mockMovie] }, not_found: [] };
    vi.stubGlobal('fetch', vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responseBody),
      })
    ));

    renderImdbImport();

    const fileInput = screen.getByLabelText('Select IMDb Export File');
    await fireEvent.change(fileInput, { target: { files: [createFakeFile()] } });

    const button = screen.getByRole('button', { name: /import from imdb/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAddToLog).toHaveBeenCalledWith(expect.stringContaining('1 movies'));
    });

    await waitFor(() => {
      expect(screen.getByText(/imported movies from IMDB/i)).toBeTruthy();
    });
  });

  it('logs error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, _init?: RequestInit) =>
      Promise.reject(new Error('Network error'))
    ));

    renderImdbImport();

    const fileInput = screen.getByLabelText('Select IMDb Export File');
    await fireEvent.change(fileInput, { target: { files: [createFakeFile()] } });

    const button = screen.getByRole('button', { name: /import from imdb/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAddToLog).toHaveBeenCalledWith(expect.stringContaining('error'));
    });
  });
});
