# lazy-hook package

Source for the published `lazy-hook` package. The repository root README covers installation and usage; this file covers local development.

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

If `../example/assets` has already installed the tarball, reinstall `lazy-hook` there or refresh `../example/assets/bun.lock`; otherwise Bun may continue using a cached copy.
