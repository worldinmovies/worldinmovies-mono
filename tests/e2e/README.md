# E2E Integration Tests

Requires docker-compose stack running. Start with `pnpm e2e:up`.

### Playwright (default)
```
# Install browsers (chromium for CI)
pnpm playwright install chromium

# Run tests
pnpm e2e:test      # headless run
pnpm e2e:ui        # UI mode
```

### Artillery (load testing)

```
pnpm artillery:run
```