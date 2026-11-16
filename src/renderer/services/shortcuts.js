// src/renderer/services/shortcuts.js
// Central keyboard shortcut manager singleton.

import {
  parseCombo,
  eventToCombo,
  isEditableTarget,
  isReserved,
  resolveActive
} from './shortcuts.logic.js';

class ShortcutManager {
  constructor() {
    this.entries = [];
    this.contextStack = ['global'];
    this.running = false;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  start() {
    if (this.running || typeof window === 'undefined') return;
    window.addEventListener('keydown', this._handleKeyDown, { capture: true });
    this.running = true;
  }

  stop() {
    if (!this.running || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this._handleKeyDown, { capture: true });
    this.running = false;
  }

  /**
   * Register a shortcut combo.
   * @param {string} comboStr - e.g. "F2", "Ctrl+S"
   * @param {(e: KeyboardEvent) => void} handler
   * @param {object} [opts]
   * @param {string} [opts.context] - default 'global'
   * @param {boolean} [opts.allowInInputs] - default false
   * @param {boolean} [opts.preventDefault] - default true
   * @returns {() => void} unregister fn
   */
  register(comboStr, handler, opts = {}) {
    const combo = parseCombo(comboStr);
    if (!combo) throw new Error(`shortcuts: invalid combo "${comboStr}"`);
    if (isReserved(combo)) {
      console.warn(`shortcuts: combo "${combo}" is reserved by system, ignoring registration`);
      return () => {};
    }

    const entry = {
      combo,
      handler,
      context: opts.context || 'global',
      allowInInputs: opts.allowInInputs ?? false,
      preventDefault: opts.preventDefault ?? true,
      description: opts.description || ''
    };

    this.entries.push(entry);

    return () => {
      const idx = this.entries.indexOf(entry);
      if (idx !== -1) this.entries.splice(idx, 1);
    };
  }

  /**
   * Helper to register a shortcut tied to a scope's lifetime.
   */
  scoped(scope, comboStr, handler, opts = {}) {
    const unsub = this.register(comboStr, handler, opts);
    scope.add(unsub);
    return unsub;
  }

  pushContext(ctx) {
    if (ctx && !this.contextStack.includes(ctx)) {
      this.contextStack.push(ctx);
    }
  }

  popContext(ctx) {
    if (ctx) {
      const idx = this.contextStack.lastIndexOf(ctx);
      if (idx > 0) this.contextStack.splice(idx, 1);
    } else if (this.contextStack.length > 1) {
      this.contextStack.pop();
    }
  }

  getCurrentContext() {
    return this.contextStack[this.contextStack.length - 1];
  }

  unregisterAll() {
    this.entries = [];
    this.contextStack = ['global'];
  }

  list() {
    return this.entries.map(e => ({
      combo: e.combo,
      context: e.context,
      description: e.description
    }));
  }

  _handleKeyDown(e) {
    const combo = eventToCombo(e);
    if (!combo || isReserved(combo)) return;

    const isEditable = isEditableTarget(e.target);
    const match = resolveActive(this.entries, this.contextStack, combo, isEditable);

    if (match) {
      if (match.preventDefault) {
        e.preventDefault();
      }
      try {
        match.handler(e);
      } catch (err) {
        console.error(`Shortcut handler error for [${combo}]:`, err);
      }
    }
  }
}

export const shortcuts = new ShortcutManager();
