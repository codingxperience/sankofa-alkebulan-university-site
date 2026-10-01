import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  readonly requestId: string;
  readonly ip: string;
  readonly method: string;
  readonly path: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Runs `fn` with the given context visible to everything it calls, including logs. */
export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function currentRequestContext(): RequestContext | undefined {
  return storage.getStore();
}
