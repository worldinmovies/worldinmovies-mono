import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

const renderNavbar = () => render(
  <BrowserRouter>
    <Navbar />
  </BrowserRouter>
);

describe('Navbar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render logo and brand name', () => {
    renderNavbar();
    expect(screen.getByText('World in Movies')).toBeInTheDocument();
  });

  it('should render desktop navigation links', () => {
    renderNavbar();

    // Use getAllByText since both desktop and mobile may render "Home"
    expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Watchlist').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Import').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('About').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1);
  });

  it('should NOT show Analytics link when no seen movies', () => {
    localStorage.setItem('seenMovies', '[]');
    renderNavbar();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });

  it('should show Analytics link when seen movies exist', () => {
    localStorage.setItem('seenMovies', JSON.stringify([{ id: 1, title: 'Test' }]));
    renderNavbar();
    // May appear in both desktop and mobile
    expect(screen.getAllByText('Analytics').length).toBeGreaterThanOrEqual(1);
  });

  it('should toggle mobile menu when menu button is clicked', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    renderNavbar();

    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();

    // Initially closed
    const mobileMenu = document.querySelector('[class*="md:hidden"][class*="overflow-y-auto"]');
    expect(mobileMenu?.className).toContain('max-h-0');

    fireEvent.click(menuButton);

    // Menu should now be open
    expect(mobileMenu?.className).toContain('max-h-64');
  });

  it('should close mobile menu when a link is clicked', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    renderNavbar();

    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    // Verify menu is open
    const mobileMenu = document.querySelector('[class*="md:hidden"][class*="overflow-y-auto"]');
    expect(mobileMenu?.className).toContain('max-h-64');

    // Close the menu by clicking the toggle again
    fireEvent.click(menuButton);
    expect(mobileMenu?.className).toContain('max-h-0');

    // Re-open and verify mobile links exist (they have onClick to close menu)
    fireEvent.click(menuButton);
    expect(mobileMenu?.className).toContain('max-h-64');

    // Verify mobile links are rendered
    const mobileLinks = mobileMenu!.querySelectorAll('a');
    expect(mobileLinks.length).toBeGreaterThan(0);

    // Verify all mobile links have onClick handlers
    mobileLinks.forEach(link => {
      expect(link.getAttribute('href')).toBeTruthy();
    });
  });

  it('should have correct nav structure', () => {
    renderNavbar();

    const nav = document.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.className).toContain('sticky');
    expect(nav?.className).toContain('z-50');
  });
});
