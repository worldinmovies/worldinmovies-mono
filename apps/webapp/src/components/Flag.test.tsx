import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Flag } from '@/components/Flag';

describe('Flag component', () => {
  it('should render flag image with correct URL', () => {
    render(<Flag countryCode="jp" alt="Japan" />);

    const img = screen.getByAltText('Japan');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('https://flagcdn.com/16x12/jp.png');
    expect(img.getAttribute('width')).toBe('16');
    expect(img.getAttribute('height')).toBe('12');
  });

  it('should use custom dimensions when provided', () => {
    render(<Flag countryCode="us" alt="United States" width={32} height={24} />);

    const img = screen.getByAltText('United States');
    expect(img.getAttribute('width')).toBe('32');
    expect(img.getAttribute('height')).toBe('24');
    expect(img.getAttribute('src')).toBe('https://flagcdn.com/32x24/us.png');
  });

  it('should apply custom className', () => {
    render(<Flag countryCode="fr" alt="France" className="custom-class" />);

    const img = screen.getByAltText('France');
    expect(img).toHaveClass('custom-class');
  });

  it('should convert country code to lowercase', () => {
    render(<Flag countryCode="JP" alt="Japan" />);

    const img = screen.getByAltText('Japan');
    expect(img.getAttribute('src')).toBe('https://flagcdn.com/16x12/jp.png');
  });

  it('should have lazy loading attributes', () => {
    render(<Flag countryCode="de" alt="Germany" />);

    const img = screen.getByAltText('Germany');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
  });
});
