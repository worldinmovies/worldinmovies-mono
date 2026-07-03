# K6 Load Testing

## Smoke Test

A lightweight smoke load test that verifies backend endpoints can handle
low-concurrency traffic within acceptable latency thresholds.

Run locally against a running tmdb backend:

```bash
k6 run tests/e2e/k6/script.js
```

Run against a custom URL:

```bash
TMDB_URL=http://localhost:8020 k6 run tests/e2e/k6/script.js
```

## CI Integration

The smoke test runs automatically in CI as part of the `integration-test` job,
after all E2E tests pass. It uses the Grafana k6 Docker image to avoid
installing k6 natively.
