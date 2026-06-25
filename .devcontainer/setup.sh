#!/usr/bin/env bash
set -euo pipefail

echo "Installing dependencies..."
bun install

echo "Setting up example application..."
cd example
mix setup
cd assets
bun install
bun run playwright install chromium --with-deps
