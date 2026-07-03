#!/bin/bash
# Generate self-signed TLS certs for local HTTPS development.
# Uses mkcert (recommended) or falls back to openssl.
# Run from repo root:  bash scripts/generate-dev-certs.sh

set -euo pipefail

CERTS_DIR="apps/webapp/nginx/certs"
LIVE_DIR="$CERTS_DIR/live"

mkdir -p "$CERTS_DIR" "$LIVE_DIR"

if command -v mkcert &>/dev/null; then
  echo "Using mkcert..."
  mkcert -install 2>/dev/null || true
  mkcert \
    -cert-file "$CERTS_DIR/local-cert.pem" \
    -key-file "$CERTS_DIR/local-key.pem" \
    localhost webapp.localhost 127.0.0.1 ::1
  echo "Certs written to $CERTS_DIR/"
else
  echo "mkcert not found. Generating self-signed certs with openssl..."
  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$CERTS_DIR/local-key.pem" \
    -out "$CERTS_DIR/local-cert.pem" \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:webapp.localhost,IP:127.0.0.1"
  echo "Certs written to $CERTS_DIR/"
fi
