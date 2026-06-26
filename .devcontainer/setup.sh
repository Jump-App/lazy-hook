#!/usr/bin/env bash
set -euo pipefail

echo "Installing dependencies..."
cd lazy-hook
bun install
bun run pack:local

echo "Setting up example application..."
cd ../example/assets
bun install
bun run playwright install chromium --with-deps
cd ..
mix setup
