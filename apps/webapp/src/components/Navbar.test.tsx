import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '@/components/Navbar';

describe('Navbar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock Device.getInfo
    vi.mock('@capacitor/device', () => ({
      Device: {
        getInfo: vi.fn().mockResolvedValue({ platform: 'web' }),
      },
    }));
  });

  it('should render logo and brand name', () => {
    render(<Navbar />);
    expect(screen.getByText('World in Movies')).toBeInTheDocument();
  });

  it('should render desktop navigation links', () => {
    render(<Navbar />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should NOT show Analytics link when no seen movies', () => {
    localStorage.setItem('seenMovies', '[]');
    render(<Navbar />);

    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });

  it('should show Analytics link when seen movies exist', () => {
    localStorage.setItem('seenMovies', JSON.stringify([{ id: 1, title: 'Test' }]));
    render(<Navbar />);

    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should toggle mobile menu when menu button is clicked', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

    render(<Navbar />);

    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();

    // Initially menu should be closed
    const mobileLinks = document.querySelectorAll('.md:hidden .py-4');
    expect(mobileLinks[0].className).toContain('max-h-0');

    // Click to open
    fireEvent.click(menuButton);

    // Menu should be open
    expect(document.querySelector('.md:hidden .py-4')?.className).toContain('max-h-64');
  });

  it('should close mobile menu when a link is clicked', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

    const { container } = render(<Navbar />);

    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    const homeLink = container.querySelector('.md:hidden a') as HTMLElement;
    fireEvent.click(homeLink);

    // Menu should be closed after click
    expect(container.querySelector('.md:hidden .py-4')?.className).toContain('max-h-0');
  });

  it('should have correct nav structure', () => {
    render(<Navbar />);

    const nav = document.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.className).toContain('sticky');
    expect(nav?.className).toContain('z-50');
  });
});
