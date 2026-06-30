import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from '@/pages/About';

// Mock useSEO hook — matches existing test pattern
vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

describe('About page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    render(<About />);
    expect(screen.getByText('About World in Movies')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<About />);
    expect(
      screen.getByText(/A passion project for film enthusiasts who believe cinema has no borders\./),
    ).toBeInTheDocument();
  });

  it('renders mission section', () => {
    render(<About />);
    expect(screen.getByText('Our Mission')).toBeInTheDocument();
  });

  it('renders "What We Offer" section with list items', () => {
    render(<About />);
    expect(screen.getByText('What We Offer')).toBeInTheDocument();
    expect(screen.getByText(/Curated Collection/)).toBeInTheDocument();
    expect(screen.getByText(/Personal Watchlist/)).toBeInTheDocument();
    expect(screen.getByText(/Country Filtering/)).toBeInTheDocument();
    expect(screen.getByText(/Import Support/)).toBeInTheDocument();
  });

  it('renders "Why World Cinema" section', () => {
    render(<About />);
    expect(screen.getByText('Why World Cinema?')).toBeInTheDocument();
  });

  it('renders "Get in Touch" section', () => {
    render(<About />);
    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
  });
});
