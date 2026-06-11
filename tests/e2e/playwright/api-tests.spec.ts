import { test, expect } from '@playwright/test';

const tmdbUrl = process.env.TMDB_URL || 'http://localhost:8020';
const rabbitAdminUrl = 'http://localhost:15672';

test.describe('MongoDB smoke test', () => {
  test('TMDB status endpoint should indicate MongoDB connectivity', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/status`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('fetched');
    expect(body).toHaveProperty('percentageDone');
    expect(typeof body.total).toBe('number');
    expect(typeof body.fetched).toBe('number');
  });
});

test.describe('RabbitMQ smoke test', () => {
  test('RabbitMQ admin interface should be available', async ({ request }) => {
    const resp = await request.get(`${rabbitAdminUrl}/`);
    expect(resp.status()).toBe(200);
  });
});

test.describe('TMDB service endpoints', () => {
  test('Status endpoint', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/status`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('fetched');
    expect(body).toHaveProperty('percentageDone');
  });

  test('Get movie details endpoint', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/movie/2,5`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
    body.forEach((movie: Record<string, unknown>) => {
      expect(movie).toHaveProperty('id');
      expect(movie).toHaveProperty('title');
      expect(movie).toHaveProperty('overview');
    });
  });

  test('Get best movies from country endpoint', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/view/best/US`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      const movie = body[0];
      expect(movie).toHaveProperty('en_title');
      expect(movie).toHaveProperty('original_title');
      expect(movie).toHaveProperty('release_date');
    }
  });
});
