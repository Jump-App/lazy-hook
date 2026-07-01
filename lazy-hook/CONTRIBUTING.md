# @jump-app/lazy-hook package

Source for the published `@jump-app/lazy-hook` package. The repository root README covers installation and usage; this file covers local development.

## Local development

```bash
bun install
bun run check
bun run build
bun test
```

## Create the local tarball for testing

```bash
bun run pack:local
```

This writes `../lazy-hook-package.tgz`.

Be sure to refresh `../example/assets/bun.lock`, otherwise Bun will continue using a cached copy.
