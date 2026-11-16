// src/renderer/utils/overlay.js
// Overlay root management and scroll locking.
// Scroll lock is ref-counted — multiple overlays won't fight each other.

let _lockCount = 0;
let _overlayRoot = null;

/**
 * Get or create the #overlay-root element.
 * @returns {HTMLElement}
 */
export function getOverlayRoot() {
  if (_overlayRoot) return _overlayRoot;
  _overlayRoot = document.getElementById('overlay-root');
  if (!_overlayRoot) {
    throw new Error('overlay.js: #overlay-root not found in DOM. Add it to index.html.');
  }
  return _overlayRoot;
}

/**
 * Lock body scroll. Ref-counted.
 */
export function lockScroll() {
  _lockCount++;
  if (_lockCount === 1) {
    document.body.setAttribute('data-scroll-locked', '');
  }
}

/**
 * Unlock body scroll. Ref-counted.
 * Only actually unlocks when count reaches 0.
 */
export function unlockScroll() {
  if (_lockCount <= 0) return;
  _lockCount--;
  if (_lockCount === 0) {
    document.body.removeAttribute('data-scroll-locked');
  }
}

/**
 * Force unlock (for cleanup on unmount without matching lock calls).
 */
export function forceUnlockScroll() {
  _lockCount = 0;
  document.body.removeAttribute('data-scroll-locked');
}

/** Current lock count — for debugging. */
export function getScrollLockCount() {
  return _lockCount;
}
