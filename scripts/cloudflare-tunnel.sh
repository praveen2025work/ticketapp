#!/usr/bin/env bash
# Start a Cloudflare quick tunnel to the Docker frontend (port 3080).
# Requires: Docker frontend running (docker compose up -d) or pass a different URL.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BIN_DIR="$PROJECT_DIR/.bin"
CLOUDFLARED_VERSION="2026.2.0"
URL="${1:-http://localhost:3080}"

case "$(uname -m)" in
  arm64|aarch64) ARCH="arm64" ;;
  x86_64|amd64)  ARCH="amd64" ;;
  *) echo "Unsupported arch: $(uname -m)"; exit 1 ;;
esac

mkdir -p "$BIN_DIR"
CLOUDFLARED="$BIN_DIR/cloudflared"

if [[ ! -x "$CLOUDFLARED" ]]; then
  echo "Downloading cloudflared ${CLOUDFLARED_VERSION} (darwin-${ARCH})..."
  TGZ="$BIN_DIR/cloudflared-darwin-${ARCH}.tgz"
  curl -sSL -o "$TGZ" "https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/cloudflared-darwin-${ARCH}.tgz"
  tar -xzf "$TGZ" -C "$BIN_DIR"
  rm -f "$TGZ"
  chmod +x "$CLOUDFLARED"
  echo "Installed cloudflared at $CLOUDFLARED"
fi

echo "Starting tunnel to $URL"
echo "Your Cloudflare URL will appear below (https://....trycloudflare.com)."
echo "Add that URL to .env as CORS_ALLOWED_ORIGINS and run: docker compose up -d --force-recreate backend"
echo ""
exec "$CLOUDFLARED" tunnel --url "$URL"
