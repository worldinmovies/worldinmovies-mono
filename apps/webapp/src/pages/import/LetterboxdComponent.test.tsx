import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LetterboxdImport } from './LetterboxdComponent';

const mockAddToLog = vi.fn();
const mockSetIsImporting = vi.fn();

const renderLetterboxdImport = (isImporting = false) => {
  return render(
    <LetterboxdImport
      isImporting={isImporting}
      setIsImporting={mockSetIsImporting}
      addToLog={mockAddToLog}
    />
  );
};

const createFakeFile = () => {
  return new File(['date,rating,title'], 'watched.csv', { type: 'text/csv' });
};

describe('LetterboxdImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // No global cleanup needed — each test creates its own fetch mock
    // via vi.stubGlobal, which safely overwrites the previous one.
    // vi.unstubAllGlobals() would destroy the localStorage mock from setup.tsx.
  });

  it('renders import card with title, file input, and button', () => {
    renderLetterboxdImport();

    const lbHeadings = screen.getAllByText('Import from Letterboxd');
    expect(lbHeadings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Select Letterboxd Export File')).toBeTruthy();
    expect(screen.getByRole('button', { name: /import from letterboxd/i })).toBeTruthy();
  });

  it('import button is disabled without file', () => {
    renderLetterboxdImport();

    const button = screen.getByRole('button', { name: /import from letterboxd/i });
    expect(button).toBeDisabled();
  });

  it('import button is disabled during import', () => {
    renderLetterboxdImport(true);

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

    renderLetterboxdImport();

    const fileInput = screen.getByLabelText('Select Letterboxd Export File');
    await fireEvent.change(fileInput, { target: { files: [createFakeFile()] } });

    const button = screen.getByRole('button', { name: /import from letterboxd/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith('/tmdb/letterboxd/ratings', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('updates localStorage with imported movies on success', async () => {
    const mockMovie = {
      imdb_id: 'tt003',
      id: 3,
      original_title: 'Letterboxd Movie',
      release_date: '2021-03-20',
      poster_path: '/lb.jpg',
      vote_average: 8.5,
      vote_count: 300,
      country_code: 'GB',
    };

    const responseBody = { found: { group1: [mockMovie] }, not_found: [] };
    vi.stubGlobal('fetch', vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responseBody),
      })
    ));

    renderLetterboxdImport();

    const fileInput = screen.getByLabelText('Select Letterboxd Export File');
    await fireEvent.change(fileInput, { target: { files: [createFakeFile()] } });

    const button = screen.getByRole('button', { name: /import from letterboxd/i });
    fireEvent.click(button);

    // Wait for the fetch mock to have been called
    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled();
    });

    // Wait for the success log
    await waitFor(() => {
      expect(mockAddToLog).toHaveBeenCalledWith(expect.stringContaining('1 movies'));
    });

    // localStorage should now be updated
    const stored = JSON.parse(localStorage.getItem('seenMovies') || '[]');
    expect(stored.length).toBeGreaterThan(0);
  });

  it('displays status card after successful import', async () => {
    const mockMovie = {
      imdb_id: 'tt004',
      id: 4,
      original_title: 'Status Movie',
      release_date: '2023-05-10',
      poster_path: '/status.jpg',
      vote_average: 7.0,
      vote_count: 150,
      country_code: 'SE',
    };

    const responseBody = { found: { group1: [mockMovie] }, not_found: [] };
    vi.stubGlobal('fetch', vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responseBody),
      })
    ));

    renderLetterboxdImport();

    const fileInput = screen.getByLabelText('Select Letterboxd Export File');
    await fireEvent.change(fileInput, { target: { files: [createFakeFile()] } });

    const button = screen.getByRole('button', { name: /import from letterboxd/i });
    fireEvent.click(button);

    // Wait for the success log
    await waitFor(() => {
      expect(mockAddToLog).toHaveBeenCalledWith(expect.stringContaining('1 movies'));
    });

    // Status card should now be visible
    await waitFor(() => {
      expect(screen.getByText(/imported movies from Letterboxd/i)).toBeTruthy();
    });
  });

  it('logs error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, _init?: RequestInit) =>
      Promise.reject(new Error('API error'))
    ));

    renderLetterboxdImport();

    const fileInput = screen.getByLabelText('Select Letterboxd Export File');
    await fireEvent.change(fileInput, { target: { files: [createFakeFile()] } });

    const button = screen.getByRole('button', { name: /import from letterboxd/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAddToLog).toHaveBeenCalledWith(expect.stringContaining('error'));
    });
  });
});
