// src/renderer/utils/scope.js
// Lifecycle scope — auto-cleanup for event listeners, timers, intervals, child scopes.
// Usage:
//   const sc = createScope();
//   sc.on(el, 'click', handler);       // addEventListener + auto-removeEventListener
//   sc.timeout(fn, 300);               // setTimeout + auto-clearTimeout
//   sc.interval(fn, 1000);             // setInterval + auto-clearInterval
//   sc.add(cleanup);                   // arbitrary cleanup fn
//   const child = sc.child();          // child scope — disposed when parent disposes
//   sc.dispose();                      // runs all cleanups

export function createScope() {
  const cleanups = [];
  let disposed = false;

  function assertActive() {
    if (disposed) throw new Error('Scope already disposed');
  }

  const scope = {
    /**
     * Add an event listener; auto-removed on dispose.
     * @param {EventTarget} target
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} handler
     * @param {AddEventListenerOptions|boolean} [options]
     */
    on(target, type, handler, options) {
      assertActive();
      target.addEventListener(type, handler, options);
      cleanups.push(() => target.removeEventListener(type, handler, options));
      return scope;
    },

    /**
     * setTimeout — auto-cleared on dispose.
     * @param {() => void} fn
     * @param {number} ms
     * @returns {number} timer id
     */
    timeout(fn, ms) {
      assertActive();
      const id = setTimeout(fn, ms);
      const cleanup = () => clearTimeout(id);
      cleanups.push(cleanup);
      return id;
    },

    /**
     * setInterval — auto-cleared on dispose.
     * @param {() => void} fn
     * @param {number} ms
     * @returns {number} interval id
     */
    interval(fn, ms) {
      assertActive();
      const id = setInterval(fn, ms);
      cleanups.push(() => clearInterval(id));
      return id;
    },

    /**
     * Add an arbitrary cleanup function.
     * @param {() => void} fn
     */
    add(fn) {
      assertActive();
      cleanups.push(fn);
      return scope;
    },

    /**
     * Create a child scope — disposed automatically when parent disposes.
     * @returns {Scope}
     */
    child() {
      assertActive();
      const child = createScope();
      cleanups.push(() => child.dispose());
      return child;
    },

    /**
     * Dispose the scope — runs all cleanups in reverse order.
     */
    dispose() {
      if (disposed) return;
      disposed = true;
      for (let i = cleanups.length - 1; i >= 0; i--) {
        try { cleanups[i](); } catch { /* ignore cleanup errors */ }
      }
      cleanups.length = 0;
    },

    get isDisposed() { return disposed; }
  };

  return scope;
}
