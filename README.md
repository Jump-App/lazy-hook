# lazy-hook repo

The npm package lives in `./lazy-hook`.

Run Bun commands from that directory:

```bash
cd lazy-hook
bun install
bun run check
bun run build
bun run pack:local
```

That creates `lazy-hook-package.tgz` at the repository root, which the Phoenix example consumes as a real packaged install.
