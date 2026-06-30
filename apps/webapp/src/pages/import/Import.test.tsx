import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Import from './Import';

const renderImport = () => {
  return render(
    <BrowserRouter>
      <Import />
    </BrowserRouter>
  );
};

describe('Import page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // No global cleanup needed — each test creates its own fetch mock
    // via vi.stubGlobal, which safely overwrites the previous one.
    // vi.unstubAllGlobals() would destroy the localStorage mock from setup.tsx.
  });

  it('renders the page title and description', () => {
    renderImport();
    expect(screen.getByText('Import Your Movies')).toBeTruthy();
    expect(screen.getByText(/Import your watched movies/i)).toBeTruthy();
  });

  it('renders the three import cards (IMDb, Trakt.tv, Letterboxd)', () => {
    renderImport();
    const imdbHeadings = screen.getAllByText('Import from IMDb');
    expect(imdbHeadings.length).toBeGreaterThanOrEqual(1);
    const lbHeadings = screen.getAllByText('Import from Letterboxd');
    expect(lbHeadings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Import from Trakt.tv')).toBeTruthy();
  });

  it('renders ImdbImport and LetterboxdImport sub-components with file inputs', () => {
    renderImport();
    expect(screen.getByLabelText('Select IMDb Export File')).toBeTruthy();
    expect(screen.getByLabelText('Select Letterboxd Export File')).toBeTruthy();
  });

  it('renders Trakt.tv connect button', () => {
    renderImport();
    const traktButton = screen.getByRole('button', { name: /connect to trakt/i });
    expect(traktButton).toBeTruthy();
  });

  it('does not show import progress card initially', () => {
    renderImport();
    expect(screen.queryByText(/Import Progress/i)).toBeNull();
  });
});
