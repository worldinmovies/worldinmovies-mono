#!/usr/bin/env bash
# Wait for test infrastructure containers to be healthy.
# Usage: ./wait-for-test-infra.sh [--timeout 60] [--services mongo,redis,rabbitmq]

set -euo pipefail

TIMEOUT=60
SERVICES="mongo redis rabbitmq"
COMPOSE_FILE="docker-compose.test.yml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --services) SERVICES="${2//,/ }"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

echo "Waiting for test infrastructure to become healthy..."
echo "  Services: $SERVICES"
echo "  Timeout: ${TIMEOUT}s"

start_ts=$(date +%s)
for service in $SERVICES; do
  container="tmdb-test-${service}"
  waited=0
  while true; do
    now=$(date +%s)
    elapsed=$((now - start_ts))
    [[ $elapsed -ge $TIMEOUT ]] && echo "  ✗ $service — TIMEOUT after ${TIMEOUT}s" && exit 1

    status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "missing")
    if [[ "$status" == "healthy" ]]; then
      echo "  ✓ $service ($container) — healthy (${waited}s)"
      break
    elif [[ "$status" == "missing" ]]; then
      if [[ $((waited % 5)) -eq 0 ]]; then
        echo "  … $service ($container) — container not yet created"
      fi
    elif [[ "$status" == "starting" ]]; then
      if [[ $((waited % 5)) -eq 0 ]]; then
        echo "  … $service ($container) — $status"
      fi
    else
      echo "  ⚠ $service ($container) — unexpected status: $status"
    fi

    sleep 1
    waited=$((waited + 1))
  done
done

echo "All test infrastructure is healthy. (${elapsed}s total)"
