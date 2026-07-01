import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Smoke load test for worldinmovies-tmdb backend.
// Designed to run as a CI step after integration tests verify correctness.
// Usage: k6 run script.js
// Target: the TMDB backend nginx proxy at localhost:8020

export const options = {
    thresholds: {
        http_req_failed: ['rate<0.01'],  // <1% failure rate
        http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    },
    vus: 5,
    iterations: 50,
};

const durationStatus = new Trend('duration_status');
const durationHealth = new Trend('duration_health');
const durationBestDefault = new Trend('duration_best_default');
const durationBestCountry = new Trend('duration_best_country');
const durationMovie = new Trend('duration_movie');
const durationGenres = new Trend('duration_genres');

const BASE = __ENV.TMDB_URL || 'http://localhost:8020';
const countryCodes = ['US', 'RU', 'FR', 'GR', 'KR', 'SE', 'FI', 'CZ', 'PL'];
const movieIds = ['2', '5', '490', '238', '185'];

export default function () {
    // 1. Status / health check
    const status = http.get(`${BASE}/status`);
    check(status, { 'status 200': (r) => r.status === 200 });
    durationStatus.add(status.timings.duration);

    // 2. Health
    const health = http.get(`${BASE}/health`);
    check(health, { 'health 200': (r) => r.status === 200 });
    durationHealth.add(health.timings.duration);

    // 3. Genres
    const genres = http.get(`${BASE}/genres`);
    check(genres, { 'genres 200': (r) => r.status === 200 });
    durationGenres.add(genres.timings.duration);

    // 4. Best random movies
    const random = http.get(`${BASE}/view/random/best/0?limit=8`);
    check(random, { 'random/best 200': (r) => r.status === 200 });
    durationBestDefault.add(random.timings.duration);

    // 5. Best movies from a random country
    const code = countryCodes[Math.floor(Math.random() * countryCodes.length)];
    const country = http.get(`${BASE}/view/best/${code}?limit=8`);
    check(country, { 'view/best 200': (r) => r.status === 200 });
    durationBestCountry.add(country.timings.duration);

    // 6. Movie detail by ID
    const id = movieIds[Math.floor(Math.random() * movieIds.length)];
    const movie = http.get(`${BASE}/movie/${id}`);
    check(movie, { 'movie 200': (r) => r.status === 200 });
    durationMovie.add(movie.timings.duration);

    sleep(0.3);
}
