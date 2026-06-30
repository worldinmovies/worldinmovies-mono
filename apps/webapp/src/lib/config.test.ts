import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('config.ts', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // ── Branch 1 + 4 + 5: web platform, various env modes ──
  // Capacitor mock in setup.tsx returns 'web', isNative = false.
  // VITE_TMDB_URL is unset. MODE is 'test'.
  // Expected: /tmdb (the else-branch: isNative false → /tmdb)
  it('should return /tmdb for web platform in test mode with no env var', async () => {
    const { BACKEND_URL } = await import('@/lib/config');
    expect(BACKEND_URL).toBe('/tmdb');
  });

  // ── Branch 2: VITE_TMDB_URL set, web platform → use env var ──
  it('should use VITE_TMDB_URL when set and platform is web', async () => {
    vi.stubEnv('VITE_TMDB_URL', 'http://my-custom-backend:8020');
    const { BACKEND_URL } = await import('@/lib/config');
    expect(BACKEND_URL).toBe('http://my-custom-backend:8020');
    vi.unstubAllEnvs();
  });

  // ── Branch 5: web / production → /tmdb ──
  it('should return /tmdb for web platform in production mode', async () => {
    vi.stubEnv('MODE', 'production');
    const { BACKEND_URL } = await import('@/lib/config');
    expect(BACKEND_URL).toBe('/tmdb');
    vi.unstubAllEnvs();
  });
});
