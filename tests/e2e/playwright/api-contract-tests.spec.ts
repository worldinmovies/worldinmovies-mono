import { test, expect } from '@playwright/test';

const tmdbUrl = process.env.TMDB_URL || 'http://localhost:8020';

test.describe('API Contract Validation (Phase 2.3)', () => {
  test('/genres returns array of strings', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/genres`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(typeof body[0]).toBe('string');
    }
  });

  test('/search/movies/{query} returns Meilisearch format with hits', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/search/movies/test`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty('hits');
    expect(Array.isArray(body.hits)).toBe(true);
    // If there are hits, each should have id and title
    if (body.hits.length > 0) {
      const hit = body.hits[0];
      expect(hit).toHaveProperty('id');
      expect(hit).toHaveProperty('title');
    }
  });

  test('/view/random/best/{n} returns list with expected fields', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/view/random/best/0?limit=4`);
    expect(resp.status()).toBe(200);

    // The response may be a list (array) or an object with seed/results
    const body = await resp.json();
    if (Array.isArray(body)) {
      // DiscoveryMovie list format
      if (body.length > 0) {
        const movie = body[0];
        expect(movie).toHaveProperty('original_title');
        expect(movie).toHaveProperty('estimated_country');
        expect(movie).toHaveProperty('vote_average');
      }
    } else {
      // { seed, results } object format (empty database fallback)
      expect(body).toHaveProperty('seed');
      expect(body).toHaveProperty('results');
      expect(Array.isArray(body.results)).toBe(true);
    }
  });

  test('/movie/{id} returns single movie or null', async ({ request }) => {
    // Try an ID that likely exists (1) — might be null if empty database
    const resp = await request.get(`${tmdbUrl}/movie/1`);
    expect(resp.status()).toBe(200);
    const text = await resp.text();
    // The endpoint returns the Movie JSON string or the string "None"
    if (text !== 'None' && text !== 'null') {
      const body = JSON.parse(text);
      expect(body).toHaveProperty('_id');
      expect(body).toHaveProperty('original_title');
    }
  });

  test('/letterboxd/ratings GET returns 400', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/letterboxd/ratings`);
    expect(resp.status()).toBe(400);
  });
});

test.describe('Error Handling (Phase 2.4)', () => {
  test('/movie/99999999 returns null for non-existent movie', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/movie/99999999`);
    expect(resp.status()).toBe(200);
    const text = await resp.text();
    expect(text).toBe('None');
  });

  test('/view/best/XX returns empty array for unknown country code', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/view/best/XX`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });
});
