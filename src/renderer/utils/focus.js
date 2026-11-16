// src/renderer/utils/focus.js
// Focus management utilities — focus trap, focusable query, firstFocus.
// data-focus-ignore attribute excludes elements from focusable list.

/** Selectors for naturally focusable elements. */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'details > summary',
].join(',');

/**
 * Get all focusable elements within a container.
 * Excludes elements with data-focus-ignore attribute.
 * @param {Element} container
 * @returns {Element[]}
 */
export function getFocusable(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
    el => !el.closest('[data-focus-ignore]') && !el.hasAttribute('data-focus-ignore')
      && isVisible(el)
  );
}

/**
 * Focus the first focusable element in a container.
 * @param {Element} container
 * @param {object} [opts]
 * @param {boolean} [opts.preventScroll]
 */
export function focusFirst(container, opts = {}) {
  const focusable = getFocusable(container);
  if (focusable.length > 0) {
    focusable[0].focus({ preventScroll: opts.preventScroll ?? false });
    return true;
  }
  return false;
}

/**
 * Trap focus within a container.
 * Returns an unsubscribe function.
 * @param {Element} container
 * @returns {() => void}
 */
export function trapFocus(container) {
  function handleKeydown(e) {
    if (e.key !== 'Tab') return;

    const focusable = getFocusable(container);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      // Shift+Tab: wrap to last
      if (active === first || !container.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: wrap to first
      if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  document.addEventListener('keydown', handleKeydown);
  return () => document.removeEventListener('keydown', handleKeydown);
}

/** Check if element is visible (not hidden via display:none, visibility:hidden, etc.) */
function isVisible(el) {
  if (el.offsetParent === null && !isFixed(el)) return false;
  const style = getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function isFixed(el) {
  const style = getComputedStyle(el);
  return style.position === 'fixed';
}
