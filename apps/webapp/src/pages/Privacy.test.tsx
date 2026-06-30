import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Privacy from '@/pages/Privacy';

// Mock useSEO hook
vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

describe('Privacy page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Privacy Policy heading', () => {
    render(<Privacy />);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders all policy sections', () => {
    render(<Privacy />);
    expect(screen.getByText('Information We Collect')).toBeInTheDocument();
    expect(screen.getByText('How We Use Your Information')).toBeInTheDocument();
    expect(screen.getByText('Data Storage and Security')).toBeInTheDocument();
    expect(screen.getByText('Third-Party Services')).toBeInTheDocument();
    expect(screen.getByText('Cookies')).toBeInTheDocument();
    expect(screen.getByText('Your Rights')).toBeInTheDocument();
    expect(screen.getByText("Children's Privacy")).toBeInTheDocument();
    expect(screen.getByText('Changes to This Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
  });

  it('renders last updated date', () => {
    render(<Privacy />);
    const today = new Date().toLocaleDateString();
    expect(screen.getByText(`Last updated: ${today}`)).toBeInTheDocument();
  });

  it('renders data collection list items', () => {
    render(<Privacy />);
    expect(screen.getByText(/Account information/)).toBeInTheDocument();
    expect(screen.getByText(/Watchlist and movie preferences/)).toBeInTheDocument();
    expect(screen.getByText(/Usage data and analytics/)).toBeInTheDocument();
  });

  it('renders data usage list items', () => {
    render(<Privacy />);
    expect(screen.getByText(/Provide, maintain, and improve our services/)).toBeInTheDocument();
    expect(screen.getByText(/Personalize your experience/)).toBeInTheDocument();
    expect(screen.getByText(/Send you technical notices and support messages/)).toBeInTheDocument();
    expect(screen.getByText(/Protect against fraudulent or illegal activity/)).toBeInTheDocument();
  });

  it('renders user rights list items', () => {
    render(<Privacy />);
    expect(screen.getByText(/Access and receive a copy of your personal data/)).toBeInTheDocument();
    expect(screen.getByText(/Rectify inaccurate personal data/)).toBeInTheDocument();
    expect(screen.getByText(/Request deletion of your personal data/)).toBeInTheDocument();
    expect(screen.getByText(/Object to or restrict processing of your personal data/)).toBeInTheDocument();
  });
});
