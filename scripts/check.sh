#!/usr/bin/env bash
set -euo pipefail

cd lazy-hook
bun run check
bun run build
bun test
cd ../example
mix deps.get
mix precommit
