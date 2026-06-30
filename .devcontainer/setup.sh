#!/usr/bin/env bash
set -euo pipefail

echo "Installing dependencies..."
cd lazy-hook
bun install
bun run build

echo "Setting up example application..."
cd ../example
mix deps.get
cd assets
bun install
bun run playwright install chromium --with-deps
cd ..
mix setup
