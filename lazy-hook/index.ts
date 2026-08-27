import { ViewHook } from "phoenix_live_view";

type ViewHookConstructorArgs<E extends HTMLElement = HTMLElement> =
  ConstructorParameters<typeof ViewHook<E>>;
type ViewHookClass = new (...args: ViewHookConstructorArgs) => ViewHook;
type ViewHookModule<ExportName extends string> = Record<
  ExportName,
  ViewHookClass
> &
  Partial<Record<string, unknown>>;
type ViewHookLoader<ExportName extends string> = () => Promise<
  ViewHookModule<ExportName>
>;
type LiveView = NonNullable<ViewHookConstructorArgs[0]>;
type ViewHookRegistry = Record<string, ViewHook | undefined>;

type LazyHookState = {
  realHook?: ViewHook;
  loading?: Promise<void>;
  destroyed: boolean;
  queuedUpdated: boolean;
};

const stateByHook = new WeakMap<ViewHook, LazyHookState>();

function isViewHookClass(definition: unknown): definition is ViewHookClass {
  return (
    typeof definition === "function" && definition.prototype instanceof ViewHook
  );
}

function isViewHookRegistry(value: unknown): value is ViewHookRegistry {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every(
      (hook) => hook === undefined || hook instanceof ViewHook,
    )
  );
}

function viewHookRegistry(view: unknown): ViewHookRegistry | undefined {
  if (
    typeof view !== "object" ||
    view === null ||
    !("viewHooks" in view)
  ) {
    return undefined;
  }

  return isViewHookRegistry(view.viewHooks) ? view.viewHooks : undefined;
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
    private readonly view: LiveView | null;

    constructor(...args: ViewHookConstructorArgs<E>) {
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

          realHook.mounted();
          if (state.queuedUpdated) {
            state.queuedUpdated = false;
            realHook.updated();
          }
        })
        .catch((error) => {
          console.error(
            `Failed to initialize lazy hook "${resolvedExportName}"`,
            error,
          );
        });
    }

    override beforeUpdate(toEl: E) {
      const realHook = stateFor(this).realHook;
      if (realHook) {
        realHook.beforeUpdate(toEl);
      }
    }

    override updated() {
      const state = stateFor(this);
      if (state.realHook) {
        state.realHook.updated();
      } else {
        state.queuedUpdated = true;
      }
    }

    override destroyed() {
      const state = stateFor(this);
      state.destroyed = true;
      if (state.realHook) {
        state.realHook.destroyed();
      }
    }

    override disconnected() {
      const realHook = stateFor(this).realHook;
      if (realHook) {
        realHook.disconnected();
      }
    }

    override reconnected() {
      const realHook = stateFor(this).realHook;
      if (realHook) {
        realHook.reconnected();
      }
    }
  };
}
