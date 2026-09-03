import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MovieCard } from '@/components/MovieCard';
import { Movie } from '@/lib/models';

const mockMovie: Movie = {
  id: 1,
  title: 'Akira',
  year: 1988,
  country: 'Japan',
  countryCode: 'jp',
  countryFlag: 'https://flagcdn.com/16x12/jp.png',
  director: 'Katsuhiro Otomo',
  rating: 8.5,
  genres: ['Animation', 'Sci-Fi'],
  poster: 'https://image.tmdb.org/t/p/w300/akira.jpg',
  description: 'A cyberpunk classic from Japan',
};

describe('MovieCard component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render movie title', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('Akira')).toBeInTheDocument();
  });

  it('should render movie year', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('1988')).toBeInTheDocument();
  });

  it('should render movie country', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('Japan')).toBeInTheDocument();
  });

  it('should render director name', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('Dir. Katsuhiro Otomo')).toBeInTheDocument();
  });

  it('should render rating', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('8.5')).toBeInTheDocument();
  });

  it('should render genres', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('Animation, Sci-Fi')).toBeInTheDocument();
  });

  it('should render poster image with correct src', () => {
    render(<MovieCard movie={mockMovie} />);
    const img = screen.getByAltText(/Akira \(1988\)/);
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('https://image.tmdb.org/t/p/w300/akira.jpg');
  });

  it('should render country flag', () => {
    render(<MovieCard movie={mockMovie} />);
    const flag = screen.getByAltText('Japan');
    expect(flag).toBeInTheDocument();
    expect(flag.getAttribute('src')).toBe('https://flagcdn.com/16x12/jp.png');
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<MovieCard movie={mockMovie} onClick={handleClick} />);

    fireEvent.click(screen.getByText('Akira'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should show fallback when image fails to load', () => {
    render(<MovieCard movie={mockMovie} />);

    // Simulate image error
    const img = screen.getByAltText(/Akira \(1988\)/);
    fireEvent.error(img);

    expect(screen.getByText('No poster available')).toBeInTheDocument();
  });

  it('should render description on desktop', () => {
    // Make viewport wide enough for md:block
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 });
    const mql = window.matchMedia('(min-width: 768px)');
    Object.defineProperty(mql, 'matches', { value: true });

    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('A cyberpunk classic from Japan')).toBeInTheDocument();
  });
});
