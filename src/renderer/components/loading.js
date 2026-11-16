// src/renderer/components/loading.js
// Spinner, Busy overlay (flicker-free delay + min duration), Skeleton placeholder.

import { h } from '../utils/dom.js';
import { getOverlayRoot } from '../utils/overlay.js';
import { icon } from './icon.js';
import { t } from '../i18n/t.js';

/**
 * Spinner component.
 * @param {object} [opts]
 * @param {string} [opts.size]
 * @param {string} [opts.className]
 * @returns {SVGElement}
 */
export function spinner(opts = {}) {
  const { size = 'var(--icon-md)', className = '' } = opts;
  const classes = ['spin'];
  if (className) classes.push(className);

  return icon('loader-circle', {
    size,
    className: classes.join(' '),
    title: t('app.loading')
  });
}

/**
 * Busy overlay indicator with 150ms delay and 300ms min display duration.
 * Prevents flicker on fast async operations.
 * @param {object} [opts]
 * @param {string} [opts.message]
 * @param {number} [opts.delay] - ms before overlay becomes visible
 * @param {number} [opts.minDuration] - min ms overlay remains once visible
 * @returns {{ stop: () => Promise<void> }}
 */
export function busy(opts = {}) {
  const {
    message = t('app.loading'),
    delay = 150,
    minDuration = 300
  } = opts;

  let shown = false;
  let showTime = 0;
  let timer = null;

  const overlayEl = h('div', {
    class: 'busy-overlay',
    role: 'alert',
    'aria-busy': 'true',
    'aria-live': 'assertive'
  });

  const card = h('div', { class: 'busy-overlay__card' });
  card.appendChild(spinner({ size: '2.5rem', className: 'busy-overlay__spinner' }));
  if (message) {
    card.appendChild(h('div', { class: 'busy-overlay__text' }, message));
  }
  overlayEl.appendChild(card);

  timer = setTimeout(() => {
    shown = true;
    showTime = Date.now();
    const root = getOverlayRoot();
    root.appendChild(overlayEl);
  }, delay);

  return {
    async stop() {
      if (!shown) {
        // Stopped before delay elapsed — never showed up
        clearTimeout(timer);
        return;
      }

      const elapsed = Date.now() - showTime;
      const wait = Math.max(0, minDuration - elapsed);

      if (wait > 0) {
        await new Promise(r => setTimeout(r, wait));
      }

      overlayEl.classList.add('busy-overlay--fading');
      setTimeout(() => {
        if (overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
      }, 150);
    }
  };
}

/**
 * Skeleton placeholder block.
 * @param {object} [opts]
 * @param {string} [opts.width] - CSS width
 * @param {string} [opts.height] - CSS height
 * @param {string} [opts.radius] - CSS border-radius
 * @param {string} [opts.className]
 * @returns {HTMLDivElement}
 */
export function skeleton(opts = {}) {
  const {
    width = '100%',
    height = '1rem',
    radius = 'var(--radius-md)',
    className = ''
  } = opts;

  const classes = ['skeleton'];
  if (className) classes.push(className);

  const el = h('div', {
    class: classes.join(' '),
    'aria-hidden': 'true'
  });

  el.style.setProperty('inline-size', width);
  el.style.setProperty('block-size', height);
  el.style.setProperty('border-radius', radius);

  return el;
}
