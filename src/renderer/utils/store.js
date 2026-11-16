// src/renderer/utils/store.js
// Minimal reactive store — get/set/subscribe/select.
// Shallow comparison — only notifies subscribers when value actually changes.
// No external dependencies.

/**
 * Create a reactive store.
 * @template T
 * @param {T} initialState
 * @returns {{ get(): T, set(partial: Partial<T>|((s:T)=>Partial<T>)): void, subscribe(fn: (s:T)=>void): ()=>void, select<K>(selector:(s:T)=>K, fn:(v:K)=>void): ()=>void }}
 */
export function createStore(initialState) {
  let state = { ...initialState };
  const subscribers = new Set();

  function get() {
    return state;
  }

  function set(partial) {
    const update = typeof partial === 'function' ? partial(state) : partial;
    const next = { ...state, ...update };

    // Shallow comparison
    let changed = false;
    for (const key of Object.keys(next)) {
      if (!Object.is(next[key], state[key])) {
        changed = true;
        break;
      }
    }
    if (!changed) {
      // Also check for deleted keys
      for (const key of Object.keys(state)) {
        if (!(key in next)) {
          changed = true;
          break;
        }
      }
    }

    if (!changed) return;

    state = next;
    for (const fn of subscribers) {
      try { fn(state); } catch { /* don't let subscriber errors break others */ }
    }
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  /**
   * Subscribe to a derived value.
   * Only calls fn when the selected slice actually changes (by Object.is).
   * @template K
   * @param {(s: T) => K} selector
   * @param {(value: K) => void} fn
   * @returns {() => void}
   */
  function select(selector, fn) {
    let prev = selector(state);
    return subscribe(s => {
      const next = selector(s);
      if (!Object.is(next, prev)) {
        prev = next;
        fn(next);
      }
    });
  }

  return { get, set, subscribe, select };
}
