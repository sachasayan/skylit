import { useSyncExternalStore } from "react";
export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next: T) {
      if (Object.is(state, next)) return;
      state = next;
      listeners.forEach((fn) => fn());
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    use() {
      return useSyncExternalStore(this.subscribe, this.get);
    },
  };
}
