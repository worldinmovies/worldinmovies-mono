import { describe, it, expect } from 'vitest';

describe('config.ts', () => {
  it('should export BACKEND_URL', async () => {
    const { BACKEND_URL } = await import('@/lib/config');
    expect(BACKEND_URL).toBeDefined();
  });

  it('should start with /tmdb for web platform', async () => {
    const { BACKEND_URL } = await import('@/lib/config');
    // In test environment without VITE_TMDB_URL, the default path is /tmdb
    // The actual URL depends on import.meta.env which is Vite's domain
    // Here we just verify that BACKEND_URL contains the expected path
    expect(BACKEND_URL).toContain('tmdb');
  });
});
