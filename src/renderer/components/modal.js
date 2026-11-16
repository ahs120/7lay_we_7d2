// src/renderer/components/modal.js
// Accessible modal dialog with focus trapping, scroll locking, and shortcut context.

import { h, uid, clear } from '../utils/dom.js';
import { getOverlayRoot, lockScroll, unlockScroll } from '../utils/overlay.js';
import { trapFocus, focusFirst } from '../utils/focus.js';
import { shortcuts } from '../services/shortcuts.js';
import { icon } from './icon.js';
import { t } from '../i18n/t.js';

/**
 * @typedef {object} ModalOpts
 * @property {string} [title]
 * @property {Node|Node[]|string} [content]
 * @property {Node|Node[]} [footer]
 * @property {() => void} [onClose]
 * @property {boolean} [closeOnEsc] - default true
 * @property {boolean} [closeOnClickOutside] - default true
 * @property {'sm'|'md'|'lg'|'full'} [size] - default 'md'
 * @property {string} [className]
 */

export function modal(opts = {}) {
  const {
    title = '',
    content = null,
    footer = null,
    onClose = null,
    closeOnEsc = true,
    closeOnClickOutside = true,
    size = 'md',
    className = ''
  } = opts;

  let isOpen = false;
  let untrapFocus = null;
  let unregEsc = null;
  let prevActiveElement = null;

  const id = uid('modal');
  const titleId = `${id}-title`;

  // Backdrop
  const backdropClasses = ['modal-backdrop'];
  if (className) backdropClasses.push(`${className}-backdrop`);
  const backdrop = h('div', { class: backdropClasses.join(' ') });

  // Dialog box
  const dialogClasses = ['modal-dialog', `modal-dialog--${size}`];
  if (className) dialogClasses.push(className);

  const dialogProps = {
    class: dialogClasses.join(' '),
    role: 'dialog',
    'aria-modal': 'true',
    tabindex: '-1'
  };
  if (title) dialogProps['aria-labelledby'] = titleId;

  const dialog = h('div', dialogProps);

  // Header
  const header = h('div', { class: 'modal-header' });
  if (title) {
    header.appendChild(h('h2', { id: titleId, class: 'modal-title' }, title));
  }

  const closeBtn = h(
    'button',
    {
      type: 'button',
      class: 'modal-close-btn btn btn--ghost btn--sm btn--icon-only',
      'aria-label': t('app.close')
    },
    icon('x', { size: '1.25rem' })
  );
  closeBtn.addEventListener('click', () => close());
  header.appendChild(closeBtn);
  dialog.appendChild(header);

  // Body
  const body = h('div', { class: 'modal-body' });
  if (content) {
    if (typeof content === 'string') {
      body.appendChild(document.createTextNode(content));
    } else if (Array.isArray(content)) {
      content.forEach(c => { if (c) body.appendChild(c); });
    } else if (content instanceof Node) {
      body.appendChild(content);
    }
  }
  dialog.appendChild(body);

  // Footer
  if (footer) {
    const footerEl = h('div', { class: 'modal-footer' });
    if (Array.isArray(footer)) {
      footer.forEach(f => { if (f) footerEl.appendChild(f); });
    } else if (footer instanceof Node) {
      footerEl.appendChild(footer);
    }
    dialog.appendChild(footerEl);
  }

  backdrop.appendChild(dialog);

  if (closeOnClickOutside) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        close();
      }
    });
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    prevActiveElement = document.activeElement;

    const overlay = getOverlayRoot();
    overlay.appendChild(backdrop);
    lockScroll();
    shortcuts.pushContext('modal');

    untrapFocus = trapFocus(dialog);

    if (closeOnEsc) {
      unregEsc = shortcuts.register('Escape', () => close(), {
        context: 'modal',
        preventDefault: true
      });
    }

    // Auto-focus first focusable inside dialog, or dialog itself
    setTimeout(() => {
      if (!focusFirst(dialog)) {
        dialog.focus();
      }
    }, 50);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    if (unregEsc) {
      unregEsc();
      unregEsc = null;
    }
    if (untrapFocus) {
      untrapFocus();
      untrapFocus = null;
    }

    shortcuts.popContext('modal');
    unlockScroll();

    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }

    if (prevActiveElement && typeof prevActiveElement.focus === 'function') {
      try { prevActiveElement.focus(); } catch { /* ignore */ }
    }

    if (onClose) onClose();
  }

  return {
    el: backdrop,
    dialogEl: dialog,
    bodyEl: body,
    open,
    close,
    destroy() {
      close();
    }
  };
}
