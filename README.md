# lazy-hook

`lazy-hook` lazily loads Phoenix LiveView hooks with dynamic `import()`. It keeps `app.js` smaller by moving hook code into split chunks and loading each hook only when LiveView mounts it.

Because LiveView expects hooks to be registered synchronously at startup, `lazy-hook` installs a lightweight proxy hook and forwards lifecycle callbacks after the real hook finishes loading.

## Install

```bash
npm install @jump-app/lazy-hook
```

## Quick start

1. Enable ES modules and code splitting in esbuild. Example `config.exs`:

```diff
default: [
  args:
-    ~w(js/app.js --bundle --outdir=../priv/static/assets ...),
+    ~w(js/app.js --bundle --format=esm --splitting --chunk-names=chunks/[name]-[hash] --outdir=../priv/static/assets ...),
  cd: Path.expand("../assets", __DIR__),
  env: %{"NODE_PATH" => esbuild_node_path}
],
```

2. Load `app.js` as an ES module. Example `root.html.heex`:

```diff
- <script defer phx-track-static type="text/javascript" src={~p"/assets/app.js"}>
+ <script defer phx-track-static type="module" src={~p"/assets/app.js"}>
```

3. Wrap hook imports with `lazyHook`.

For a default export:

```diff
+ import { lazyHook } from "lazy-hook";
- import ExampleHook from "./hooks/example";

+ const ExampleHook = lazyHook(() => import("./hooks/example"));

const liveSocket = new LiveSocket("/live", Socket, {
  // ...
  hooks: { ...colocatedHooks, ExampleHook },
});

liveSocket.connect();
```

For a named export, pass the export name as the second argument:

```diff
+ import { lazyHook } from "lazy-hook";
- import { ExampleNamedHook } from "./hooks/example";

+ const ExampleNamedHook = lazyHook(() => import("./hooks/example"), "ExampleNamedHook");

const liveSocket = new LiveSocket("/live", Socket, {
  // ...
  hooks: { ...colocatedHooks, ExampleNamedHook },
});

liveSocket.connect();
```

You do not need to change the hook implementation itself.

> [!TIP]
> Lazy-load hooks that pull in large dependencies or are only used on a small part of the app. Keep small, widely used hooks in the main `app.js` bundle.

## Example loading waterfall

These traces show the effect of moving heavy hooks out of the initial bundle, on an actual user-facing page in [Jump's](https://jump.ai) Phoenix application. Network and CPU throttling are enabled here to make the difference easier to see.

### Before

![Screenshot of Chrome DevTools performance tab with a single app.js bundle](https://cdn.jsdelivr.net/gh/Jump-App/lazy-hook@27b9da3a5fc21b6cef6e701dbade61238bc961a9/assets/Before.png)

### After

![Screenshot of Chrome DevTools performance tab with LiveView hooks split into chunks via lazy-hook](https://cdn.jsdelivr.net/gh/Jump-App/lazy-hook@27b9da3a5fc21b6cef6e701dbade61238bc961a9/assets/After.png)
