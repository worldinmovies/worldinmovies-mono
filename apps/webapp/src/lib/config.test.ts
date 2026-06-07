import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('config.ts', () => {
  let originalCapacitor: any;
  let originalEnv: any;

  beforeEach(() => {
    originalCapacitor = (global as any).Capacitor;
    originalEnv = (global as any).import?.meta?.env;
  });

  afterEach(() => {
    if (originalCapacitor) {
      (global as any).Capacitor = originalCapacitor;
    } else {
      delete (global as any).Capacitor;
    }
  });

  it('should export BACKEND_URL', async () => {
    // Mock Capacitor for web
    (global as any).Capacitor = {
      getPlatform: () => 'web',
    };

    // Mock env
    const originalMeta = import.meta;
    (global as any).import = {
      meta: { env: { MODE: 'production' } },
    };

    const { BACKEND_URL } = await import('@/lib/config');
    expect(BACKEND_URL).toBeDefined();

    // Restore
    (global as any).import = { meta: originalMeta };
  });

  it('should return different URL for native platforms', async () => {
    (global as any).Capacitor = {
      getPlatform: () => 'android',
    };

    (global as any).import = {
      meta: { env: { MODE: 'development', VITE_TMDB_URL: undefined } },
    };

    const { BACKEND_URL } = await import('@/lib/config');
    // For native + development, should use local IP
    expect(BACKEND_URL).toBe('http://192.168.1.37:8020');

    (global as any).import = { meta: { env: { MODE: 'production', VITE_TMDB_URL: undefined } } };
    const prodUrl = (await import('@/lib/config')).BACKEND_URL;
    expect(prodUrl).toBe('https://worldinmovies.labb.site/tmdb');

    // Restore
    (global as any).import = { meta: { env: {} } };
  });

  it('should use VITE_TMDB_URL when available and not native', async () => {
    (global as any).Capacitor = {
      getPlatform: () => 'web',
    };

    (global as any).import = {
      meta: { env: { MODE: 'production', VITE_TMDB_URL: 'http://custom-api.example.com' } },
    };

    const { BACKEND_URL } = await import('@/lib/config');
    expect(BACKEND_URL).toBe('http://custom-api.example.com');

    (global as any).import = { meta: { env: {} } };
  });
});
