import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/HeroSection';

describe('HeroSection component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render hero content when not previously viewed', () => {
    render(<HeroSection />);

    expect(screen.getByText('Discover Cinema')).toBeInTheDocument();
    expect(screen.getByText('Without Borders')).toBeInTheDocument();
    expect(screen.getByText('Seven Samurai to Parasite')).toBeInTheDocument();
    expect(screen.getByText('50+ Countries')).toBeInTheDocument();
    expect(screen.getByText('Explore Films')).toBeInTheDocument();
  });

  it('should render Japan directors', () => {
    render(<HeroSection />);

    expect(screen.getByText('Kurosawa • Ozu • Mizoguchi')).toBeInTheDocument();
  });

  it('should render Italy directors', () => {
    render(<HeroSection />);

    expect(screen.getByText('Fellini • Visconti • Antonioni')).toBeInTheDocument();
  });

  it('should render France directors', () => {
    render(<HeroSection />);

    expect(screen.getByText('Godard • Truffaut • Renoir')).toBeInTheDocument();
  });

  it('should render Sweden directors', () => {
    render(<HeroSection />);

    expect(screen.getByText('Bergman • Sjöström • Andersson')).toBeInTheDocument();
  });

  it('should NOT render when hero has been viewed', () => {
    localStorage.setItem('heroViewed', 'true');

    const { container } = render(<HeroSection />);

    expect(container.innerHTML).toBe('');
  });

  it('should set heroViewed in localStorage on first view', () => {
    render(<HeroSection />);

    expect(localStorage.getItem('heroViewed')).toBe('true');
  });
});
