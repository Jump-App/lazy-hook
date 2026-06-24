import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { ViewHook } from "phoenix_live_view";

import { lazyHook, stateFor } from "./index";

type TestView = {
  viewHooks: Record<string, ViewHook | undefined>;
};
type ViewHookClass = new (
  ...args: ConstructorParameters<typeof ViewHook>
) => ViewHook;
type DefaultHookModule = { default: ViewHookClass };

function createHook(Hook: ViewHookClass) {
  const view: TestView = { viewHooks: {} };
  const el = document.createElement("div");
  el.id = `lazy-hook-${crypto.randomUUID()}`;
  document.body.appendChild(el);

  const hook = new Hook(view as ConstructorParameters<typeof ViewHook>[0], el);
  const hookId = ViewHook.elementID(el);
  view.viewHooks[String(hookId)] = hook;

  return { view, el, hook, hookId };
}

async function waitForLazyHookLoad(hook: ViewHook) {
  await stateFor(hook).loading;
}

describe("lazyHook", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("replaces the lazy placeholder with a real hook instance", async () => {
    class RealHook extends ViewHook {
      callbackWasCalled = false;
      callback = () => {
        this.callbackWasCalled = true;
      };

      override mounted() {
        this.callback();
      }
    }

    const LazyHook = lazyHook(() => Promise.resolve({ default: RealHook }));
    const { view, el, hook, hookId } = createHook(LazyHook);

    hook.mounted();
    await waitForLazyHookLoad(hook);

    const realHookId = ViewHook.elementID(el);
    const realHook = view.viewHooks[String(realHookId)] as RealHook;

    expect(view.viewHooks[String(hookId)]).toBeUndefined();
    expect(realHook).toBeInstanceOf(RealHook);
    expect(realHook).not.toBe(hook);
    expect(realHook.callbackWasCalled).toBe(true);
  });

  it("replays one updated lifecycle after the real hook mounts", async () => {
    const lifecycleCalls: string[] = [];
    let resolveModule: (module: DefaultHookModule) => void;

    class RealHook extends ViewHook {
      override mounted() {
        lifecycleCalls.push("mounted");
      }

      override updated() {
        lifecycleCalls.push("updated");
      }
    }

    const LazyHook = lazyHook(
      () =>
        new Promise<DefaultHookModule>((resolve) => {
          resolveModule = resolve;
        }),
    );
    const { hook } = createHook(LazyHook);

    hook.mounted();
    hook.updated();
    resolveModule!({ default: RealHook });
    await waitForLazyHookLoad(hook);

    expect(lifecycleCalls).toEqual(["mounted", "updated"]);
  });

  it("does not instantiate the real hook if the lazy placeholder is destroyed before loading finishes", async () => {
    let constructorCalls = 0;
    let mountedCalls = 0;
    let resolveModule: (module: DefaultHookModule) => void;

    class RealHook extends ViewHook {
      constructor(...args: ConstructorParameters<typeof ViewHook>) {
        super(...args);
        constructorCalls += 1;
      }

      override mounted() {
        mountedCalls += 1;
      }
    }

    const LazyHook = lazyHook(
      () =>
        new Promise<DefaultHookModule>((resolve) => {
          resolveModule = resolve;
        }),
    );
    const { hook } = createHook(LazyHook);

    hook.mounted();
    hook.destroyed();
    resolveModule!({ default: RealHook });
    await waitForLazyHookLoad(hook);

    expect(constructorCalls).toBe(0);
    expect(mountedCalls).toBe(0);
  });

  it("logs initialization errors from synchronous lifecycle methods", async () => {
    const originalConsoleError = console.error;
    const consoleError = mock((..._args: unknown[]) => {});
    console.error = consoleError;

    try {
      class RealHook extends ViewHook {
        override mounted() {
          throw new Error("mounted failed");
        }
      }

      const LazyHook = lazyHook(() => Promise.resolve({ default: RealHook }));
      const { hook } = createHook(LazyHook);

      hook.mounted();
      await waitForLazyHookLoad(hook);

      expect(consoleError).toHaveBeenCalled();
      expect(String(consoleError.mock.calls[0]?.[0])).toContain(
        'Failed to initialize lazy hook "default"',
      );
    } finally {
      console.error = originalConsoleError;
    }
  });
});
