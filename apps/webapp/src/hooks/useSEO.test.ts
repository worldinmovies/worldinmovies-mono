import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSEO } from '@/hooks/useSEO';

describe('useSEO hook', () => {
  beforeEach(() => {
    // Clean up head before each test
    const metas = document.querySelectorAll('meta');
    metas.forEach((m) => m.remove());
    const links = document.querySelectorAll('link[rel="canonical"]');
    links.forEach((l) => l.remove());
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach((s) => s.remove());
    document.title = 'World in Movies - Discover International Cinema Masterpieces';
  });

  afterEach(() => {
    // Clean up after each test
    const metas = document.querySelectorAll('meta');
    metas.forEach((m) => m.remove());
    const links = document.querySelectorAll('link[rel="canonical"]');
    links.forEach((l) => l.remove());
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach((s) => s.remove());
    document.title = 'World in Movies - Discover International Cinema Masterpieces';
    vi.useRealTimers();
  });

  describe('title update', () => {
    it('should prepend title with " | World in Movies" suffix', () => {
      const { rerender } = renderHook(
        ({ config }) => useSEO(config),
        { initialProps: { config: { title: 'Home', description: 'Test description' } } }
      );

      expect(document.title).toBe('Home | World in Movies');
    });

    it('should update title when config changes', () => {
      const { rerender } = renderHook(
        ({ config }) => useSEO(config),
        { initialProps: { config: { title: 'Initial', description: 'Test' } } }
      );

      rerender({ config: { title: 'Updated', description: 'Test' } });

      expect(document.title).toBe('Updated | World in Movies');
    });
  });

  describe('description meta tag', () => {
    it('should create and set description meta tag', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'This is a description' } },
      });

      const meta = document.querySelector('meta[name="description"]');
      expect(meta).not.toBeNull();
      expect(meta?.getAttribute('content')).toBe('This is a description');
    });

    it('should update description when config changes', () => {
      const { rerender } = renderHook(
        ({ config }) => useSEO(config),
        { initialProps: { config: { title: 'Test', description: 'Initial' } } }
      );

      rerender({ config: { title: 'Test', description: 'Updated description' } });

      const meta = document.querySelector('meta[name="description"]');
      expect(meta?.getAttribute('content')).toBe('Updated description');
    });
  });

  describe('keywords meta tag', () => {
    it('should create keywords meta tag when provided', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc', keywords: 'seo, movies' } },
      });

      const meta = document.querySelector('meta[name="keywords"]');
      expect(meta).not.toBeNull();
      expect(meta?.getAttribute('content')).toBe('seo, movies');
    });

    it('should not create keywords meta tag when not provided', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc' } },
      });

      const meta = document.querySelector('meta[name="keywords"]');
      expect(meta).toBeNull();
    });
  });

  describe('Open Graph tags', () => {
    it('should set all OG tags', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: {
          config: {
            title: 'OG Test',
            description: 'OG Description',
            ogType: 'article',
            ogImage: 'https://example.com/image.jpg',
          },
        },
      });

      expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('article');
      expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('OG Test');
      expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe('OG Description');
      expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://example.com/image.jpg');
      expect(document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')).toBe('World in Movies');
      expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
    });

    it('should use default ogType when not provided', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc' } },
      });

      expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
    });

    it('should not set og:image when image not provided', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc' } },
      });

      expect(document.querySelector('meta[property="og:image"]')).toBeNull();
    });
  });

  describe('Twitter Card tags', () => {
    it('should set all Twitter Card tags', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Twitter Test', description: 'Twitter Desc' } },
      });

      expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image');
      expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe('Twitter Test');
      expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toBe('Twitter Desc');
    });
  });

  describe('canonical URL', () => {
    it('should set canonical link when provided', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc', canonicalUrl: 'https://example.com/page' } },
      });

      const link = document.querySelector('link[rel="canonical"]');
      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('https://example.com/page');
    });

    it('should not set canonical when not provided', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc' } },
      });

      expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    });
  });

  describe('structured data (JSON-LD)', () => {
    it('should inject structured data script', () => {
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Test Org',
      };

      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc', structuredData } },
      });

      const script = document.getElementById('structured-data');
      expect(script).not.toBeNull();
      expect(script?.textContent).toBe(JSON.stringify(structuredData));
    });

    it('should not inject structured data when not provided', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc' } },
      });

      expect(document.getElementById('structured-data')).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should reset title on unmount', () => {
      const { unmount } = renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc' } },
      });

      expect(document.title).toBe('Test | World in Movies');

      unmount();

      expect(document.title).toBe('World in Movies - Discover International Cinema Masterpieces');
    });

    it('should reset description meta on unmount', () => {
      const { unmount } = renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Custom desc' } },
      });

      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Custom desc');

      unmount();

      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
        'Explore and track the finest international films from around the globe.'
      );
    });
  });

  describe('ogType variants', () => {
    it('should handle ogType "profile"', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc', ogType: 'profile' } },
      });
      expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('profile');
    });

    it('should handle ogType "video"', () => {
      renderHook(({ config }) => useSEO(config), {
        initialProps: { config: { title: 'Test', description: 'Desc', ogType: 'video' } },
      });
      expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('video');
    });
  });
});
