import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FAQ from '@/pages/FAQ';
import { useSEO } from '@/hooks/useSEO';

vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

const mockedUseSEO = vi.mocked(useSEO);

describe('FAQ page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the FAQ heading', () => {
    render(<FAQ />);
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<FAQ />);
    expect(
      screen.getByText(/Everything you need to know about discovering world cinema/),
    ).toBeInTheDocument();
  });

  it('renders all FAQ questions', () => {
    render(<FAQ />);
    expect(screen.getByText('What is World in Movies?')).toBeInTheDocument();
    expect(screen.getByText('How are the movies ranked and filtered?')).toBeInTheDocument();
    expect(screen.getByText('Can I import my watchlist from Trakt.tv?')).toBeInTheDocument();
    expect(screen.getByText('Do I need an account to use World in Movies?')).toBeInTheDocument();
    expect(screen.getByText('What countries are covered?')).toBeInTheDocument();
    expect(screen.getByText('Is my data safe and private?')).toBeInTheDocument();
    expect(screen.getByText('What browsers and devices are supported?')).toBeInTheDocument();
    expect(screen.getByText('Do you use tracking cookies?')).toBeInTheDocument();
    expect(screen.getByText('How do I report a bug or suggest a feature?')).toBeInTheDocument();
  });

  it('renders at least 5 FAQ entries', () => {
    render(<FAQ />);
    const items = screen.getAllByRole('button');
    expect(items.length).toBeGreaterThanOrEqual(5);
  });

  it('passes SEO metadata with a FAQPage structured data schema', () => {
    render(<FAQ />);
    expect(mockedUseSEO).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'FAQ',
        canonicalUrl: 'https://worldinmovies.com/faq',
        structuredData: expect.objectContaining({
          '@type': 'FAQPage',
          mainEntity: expect.arrayContaining([
            expect.objectContaining({
              '@type': 'Question',
              name: 'What is World in Movies?',
              acceptedAnswer: expect.objectContaining({ '@type': 'Answer' }),
            }),
          ]),
        }),
      }),
    );
  });

  it('structured data question count matches rendered questions', () => {
    render(<FAQ />);
    const call = mockedUseSEO.mock.calls[0]?.[0];
    const mainEntity = call?.structuredData?.mainEntity as unknown[];
    const renderedButtons = screen.getAllByRole('button');
    expect(mainEntity).toHaveLength(renderedButtons.length);
  });

  it('renders the FAQ trigger as a button', () => {
    render(<FAQ />);
    const trigger = screen.getByText('What is World in Movies?').closest('button');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('data-state');
  });
});