/*
 * phoenix_live_view v1.2.3 ships a root ViewHook type that is missing parts of
 * the runtime class surface we rely on here, especially the constructor and
 * static helpers like elementID(). Our index.ts intentionally derives types
 * from typeof ViewHook, so TypeScript needs a local declaration shim that
 * matches the actual implementation.
 */
declare module "phoenix_live_view" {
  export type OnReply = (reply: any, ref: number) => any;
  export type CallbackRef = {
    event: string;
    callback: (payload: any) => any;
  };
  export type PhxTarget = string | number | HTMLElement;

  export interface ViewLike {
    isDead?: boolean;
    viewHooks: Record<string, ViewHook | undefined>;
  }

  export class ViewHook<E extends HTMLElement = HTMLElement> {
    el: E;
    liveSocket: LiveSocket;

    constructor(view: ViewLike | null, el: E, callbacks?: unknown);

    static makeID(): number;
    static elementID(el: HTMLElement): string | number | null | undefined;
    static deadHook(el: HTMLElement): boolean;

    mounted(): void;
    beforeUpdate(): void;
    updated(): void;
    destroyed(): void;
    disconnected(): void;
    reconnected(): void;

    js(): HookInterface<E>["js"] extends (...args: never[]) => infer T
      ? T
      : never;

    pushEvent(event: string, payload: unknown, onReply: OnReply): void;
    pushEvent(event: string, payload?: unknown): Promise<any>;

    pushEventTo(
      selectorOrTarget: PhxTarget,
      event: string,
      payload: unknown,
      onReply: OnReply,
    ): void;
    pushEventTo(
      selectorOrTarget: PhxTarget,
      event: string,
      payload?: unknown,
    ): Promise<
      PromiseSettledResult<{
        reply: any;
        ref: number;
      }>[]
    >;

    handleEvent(event: string, callback: (payload: any) => any): CallbackRef;
    removeHandleEvent(ref: CallbackRef): void;
    upload(name: string, files: FileList): any;
    uploadTo(selectorOrTarget: PhxTarget, name: string, files: FileList): any;

    [key: PropertyKey]: any;
  }
}
