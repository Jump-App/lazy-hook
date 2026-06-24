import { ViewHook } from "phoenix_live_view";

type ViewHookLifecycle =
  | "mounted"
  | "beforeUpdate"
  | "updated"
  | "destroyed"
  | "disconnected"
  | "reconnected";
type ViewHookClass = new (
  ...args: ConstructorParameters<typeof ViewHook>
) => ViewHook;
type ViewHookModule<ExportName extends string> = Record<
  ExportName,
  ViewHookClass
> &
  Partial<Record<string, unknown>>;
type ViewHookLoader<ExportName extends string> = () => Promise<
  ViewHookModule<ExportName>
>;
type LiveView = NonNullable<ConstructorParameters<typeof ViewHook>[0]>;
type ViewHookRegistry = LiveView["viewHooks"] &
  Record<string, ViewHook | undefined>;
type LiveViewWithHookRegistry = LiveView & { viewHooks: ViewHookRegistry };

type LazyHookState = {
  realHook?: ViewHook;
  loading?: Promise<void>;
  destroyed: boolean;
  queuedUpdated: boolean;
};

const stateByHook = new WeakMap<ViewHook, LazyHookState>();

export function stateFor(hook: ViewHook): LazyHookState {
  const existing = stateByHook.get(hook);
  if (existing) return existing;

  const state: LazyHookState = {
    destroyed: false,
    queuedUpdated: false,
  };

  stateByHook.set(hook, state);
  return state;
}

function isViewHookClass(definition: unknown): definition is ViewHookClass {
  return (
    typeof definition === "function" && definition.prototype instanceof ViewHook
  );
}

function callLifecycle(hook: ViewHook, lifecycle: ViewHookLifecycle) {
  const callback: (() => void) | undefined = hook[lifecycle];
  if (typeof callback === "function") {
    callback.call(hook);
  }
}

function hasViewHookRegistry(
  view: LiveView | null,
): view is LiveViewWithHookRegistry {
  return (
    !!view && typeof view.viewHooks === "object" && view.viewHooks !== null
  );
}

function viewHookRegistry(view: LiveView | null): ViewHookRegistry | undefined {
  return hasViewHookRegistry(view) ? view.viewHooks : undefined;
}

function replaceLazyHookInView(
  view: LiveView | null,
  lazyHook: ViewHook,
  realHook: ViewHook,
  previousHookId: string | number | null | undefined,
) {
  const registry = viewHookRegistry(view);
  if (!registry) {
    throw new Error("Lazy hook could not find the LiveView hook registry");
  }

  const newHookId = ViewHook.elementID(realHook.el);
  if (previousHookId == null || newHookId == null) {
    throw new Error("Lazy hook could not determine hook ids");
  }

  const previousKey = String(previousHookId);
  const newKey = String(newHookId);

  if (registry[previousKey] !== lazyHook) {
    throw new Error("Lazy hook placeholder is no longer registered");
  }

  delete registry[previousKey];
  registry[newKey] = realHook;
}

export function lazyHook(load: ViewHookLoader<"default">): ViewHookClass;
export function lazyHook<ExportName extends string>(
  load: ViewHookLoader<ExportName>,
  exportName: ExportName,
): ViewHookClass;
export function lazyHook<ExportName extends string>(
  load: ViewHookLoader<ExportName>,
  exportName?: ExportName,
): ViewHookClass {
  const resolvedExportName = exportName ?? "default";
  let definitionPromise: Promise<ViewHookClass> | undefined;

  const loadDefinition = () => {
    definitionPromise ??= load().then((module) => {
      const definition: unknown = module[resolvedExportName];
      if (!definition) {
        throw new Error(
          `Lazy hook export "${resolvedExportName}" was not found`,
        );
      }

      if (!isViewHookClass(definition)) {
        throw new Error(
          `Lazy hook export "${resolvedExportName}" must be a ViewHook class`,
        );
      }

      return definition;
    });
    return definitionPromise;
  };

  return class LazyHook<
    E extends HTMLElement = HTMLElement,
  > extends ViewHook<E> {
    private readonly view: LiveView;

    constructor(...args: ConstructorParameters<typeof ViewHook>) {
      super(...args);
      this.view = args[0];
    }

    override mounted() {
      const state = stateFor(this);

      state.loading ??= loadDefinition()
        .then((Definition) => {
          if (state.destroyed) return;

          const previousHookId = ViewHook.elementID(this.el);
          const realHook = new Definition(this.view, this.el);
          replaceLazyHookInView(this.view, this, realHook, previousHookId);
          state.realHook = realHook;

          callLifecycle(realHook, "mounted");
          if (state.queuedUpdated) {
            state.queuedUpdated = false;
            callLifecycle(realHook, "updated");
          }
        })
        .catch((error) => {
          console.error(
            `Failed to initialize lazy hook "${resolvedExportName}"`,
            error,
          );
        });
    }

    override beforeUpdate() {
      const realHook = stateFor(this).realHook;
      if (realHook) {
        callLifecycle(realHook, "beforeUpdate");
      }
    }

    override updated() {
      const state = stateFor(this);
      if (state.realHook) {
        callLifecycle(state.realHook, "updated");
      } else {
        state.queuedUpdated = true;
      }
    }

    override destroyed() {
      const state = stateFor(this);
      state.destroyed = true;
      if (state.realHook) {
        callLifecycle(state.realHook, "destroyed");
      }
    }

    override disconnected() {
      const realHook = stateFor(this).realHook;
      if (realHook) {
        callLifecycle(realHook, "disconnected");
      }
    }

    override reconnected() {
      const realHook = stateFor(this).realHook;
      if (realHook) {
        callLifecycle(realHook, "reconnected");
      }
    }
  };
}
