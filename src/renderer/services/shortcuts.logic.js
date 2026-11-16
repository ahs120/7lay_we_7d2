// src/renderer/services/shortcuts.logic.js
// Pure keyboard shortcut logic — parsing, event mapping, layout independence.

export const RESERVED = new Set([
  'F11',          // Fullscreen toggle (handled by main process)
  'F12',          // DevTools (handled by main process)
  'Ctrl+Shift+I', // DevTools alternative
  'Ctrl+Shift+R', // Hard reload
  'Ctrl+R',       // Reload
  'Ctrl+F5',
  'F5'
]);

/**
 * Check if a shortcut combo is reserved by Electron/OS.
 * @param {string} combo
 * @returns {boolean}
 */
export function isReserved(combo) {
  return RESERVED.has(combo);
}

/**
 * Parse and normalize a shortcut string into standard casing and modifier order.
 * e.g. "ctrl+shift+k" -> "Ctrl+Shift+K"
 * @param {string} comboStr
 * @returns {string}
 */
export function parseCombo(comboStr) {
  if (!comboStr || typeof comboStr !== 'string') return '';

  const parts = comboStr.split('+').map(p => p.trim());
  let ctrl = false;
  let alt = false;
  let shift = false;
  let meta = false;
  let key = '';

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'ctrl' || lower === 'control') ctrl = true;
    else if (lower === 'alt') alt = true;
    else if (lower === 'shift') shift = true;
    else if (lower === 'meta' || lower === 'cmd' || lower === 'super') meta = true;
    else {
      // Normalize key name
      if (lower.startsWith('f') && /^[1-9][0-2]?$/.test(lower.slice(1))) {
        key = `F${lower.slice(1)}`;
      } else if (lower === 'esc' || lower === 'escape') {
        key = 'Escape';
      } else if (lower === 'enter' || lower === 'return') {
        key = 'Enter';
      } else if (lower === 'space') {
        key = 'Space';
      } else if (lower === 'tab') {
        key = 'Tab';
      } else if (lower === 'backspace') {
        key = 'Backspace';
      } else if (lower === 'delete' || lower === 'del') {
        key = 'Delete';
      } else if (lower.length === 1) {
        key = lower.toUpperCase();
      } else {
        key = part.charAt(0).toUpperCase() + part.slice(1);
      }
    }
  }

  const result = [];
  if (ctrl) result.push('Ctrl');
  if (alt) result.push('Alt');
  if (shift) result.push('Shift');
  if (meta) result.push('Meta');
  if (key) result.push(key);

  return result.join('+');
}

/**
 * Convert a KeyboardEvent to a normalized combo string.
 * Uses event.code for letters/digits (Arabic keyboard safe) and event.key for special keys.
 * @param {KeyboardEvent} e
 * @returns {string}
 */
export function eventToCombo(e) {
  const parts = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Meta');

  let key = '';
  const code = e.code;

  if (code.startsWith('Key')) {
    key = code.slice(3).toUpperCase();
  } else if (code.startsWith('Digit')) {
    key = code.slice(5);
  } else if (code.startsWith('Numpad') && /^Numpad\d$/.test(code)) {
    key = code.slice(6);
  } else if (/^F[1-9][0-2]?$/.test(e.key)) {
    key = e.key;
  } else if (e.key === 'Escape') {
    key = 'Escape';
  } else if (e.key === 'Enter') {
    key = 'Enter';
  } else if (e.code === 'Space' || e.key === ' ') {
    key = 'Space';
  } else if (e.key === 'Tab') {
    key = 'Tab';
  } else if (e.key === 'Backspace') {
    key = 'Backspace';
  } else if (e.key === 'Delete') {
    key = 'Delete';
  } else if (e.key === 'ArrowUp') {
    key = 'ArrowUp';
  } else if (e.key === 'ArrowDown') {
    key = 'ArrowDown';
  } else if (e.key === 'ArrowLeft') {
    key = 'ArrowLeft';
  } else if (e.key === 'ArrowRight') {
    key = 'ArrowRight';
  } else {
    // Modifier only or unsupported
    return '';
  }

  parts.push(key);
  return parts.join('+');
}

/**
 * Determine if target element is an editable input.
 * @param {EventTarget|null} target
 * @returns {boolean}
 */
export function isEditableTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'select') return true;
  if (tag === 'input') {
    const type = (target.getAttribute('type') || 'text').toLowerCase();
    const nonEditable = new Set(['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color']);
    return !nonEditable.has(type);
  }
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Find the most specific active handler for a combo in current context.
 * Matches context top of stack down to 'global'.
 * @param {Array<{ combo: string, handler: Function, context: string, allowInInputs: boolean, preventDefault: boolean }>} entries
 * @param {string[]} contextStack
 * @param {string} combo
 * @param {boolean} isEditable
 * @returns {{ handler: Function, preventDefault: boolean } | null}
 */
export function resolveActive(entries, contextStack, combo, isEditable) {
  // Check from top of context stack down
  for (let i = contextStack.length - 1; i >= 0; i--) {
    const ctx = contextStack[i];
    const match = entries.find(e => e.combo === combo && e.context === ctx);
    if (match) {
      if (isEditable && !match.allowInInputs) {
        return null; // Suppressed in editable fields
      }
      return match;
    }
  }

  // Fallback to 'global' context
  const globalMatch = entries.find(e => e.combo === combo && e.context === 'global');
  if (globalMatch) {
    if (isEditable && !globalMatch.allowInInputs) {
      return null;
    }
    return globalMatch;
  }

  return null;
}
