// src/renderer/components/toast.js
// Toast notification manager singleton — max 3, pause-on-hover, accessible roles.

import { h, uid, clear } from '../utils/dom.js';
import { getOverlayRoot } from '../utils/overlay.js';
import { icon } from './icon.js';
import { t } from '../i18n/t.js';

class ToastManager {
  constructor() {
    this.toasts = [];
    this.maxToasts = 3;
    this.container = null;
  }

  _getContainer() {
    if (this.container && document.body.contains(this.container)) {
      return this.container;
    }
    const overlay = getOverlayRoot();
    this.container = h('div', {
      class: 'toast-container',
      'aria-live': 'polite',
      'aria-atomic': 'false'
    });
    overlay.appendChild(this.container);
    return this.container;
  }

  /**
   * @param {object} opts
   * @param {string} opts.message
   * @param {'success'|'error'|'warning'|'info'} [opts.type]
   * @param {number} [opts.duration] - ms
   * @param {{ label: string, onClick: () => void }} [opts.action]
   */
  show(opts = {}) {
    const {
      message = '',
      type = 'info',
      duration = type === 'error' ? 6000 : 4000,
      action = null
    } = opts;

    const container = this._getContainer();

    // If max reached, dismiss oldest
    if (this.toasts.length >= this.maxToasts) {
      const oldest = this.toasts[0];
      this.dismiss(oldest.id);
    }

    const id = uid('toast');
    const role = type === 'error' ? 'alert' : 'status';

    const toastClasses = ['toast', `toast--${type}`];
    const toastEl = h('div', {
      id,
      class: toastClasses.join(' '),
      role
    });

    // Icon per type
    const iconMap = {
      success: 'circle-check',
      error: 'triangle-exclamation-point',
      warning: 'triangle-exclamation-point',
      info: 'info'
    };
    toastEl.appendChild(
      icon(iconMap[type] || 'info', {
        className: 'toast__icon',
        size: '1.25rem'
      })
    );

    // Text content
    const msgEl = h('span', { class: 'toast__message' }, message);
    toastEl.appendChild(msgEl);

    // Optional action
    if (action) {
      const actionBtn = h(
        'button',
        { type: 'button', class: 'toast__action btn btn--ghost btn--sm' },
        action.label
      );
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        action.onClick();
        this.dismiss(id);
      });
      toastEl.appendChild(actionBtn);
    }

    // Dismiss close button
    const closeBtn = h(
      'button',
      {
        type: 'button',
        class: 'toast__close-btn',
        'aria-label': t('toast.dismiss')
      },
      icon('x', { size: '1rem' })
    );
    closeBtn.addEventListener('click', () => this.dismiss(id));
    toastEl.appendChild(closeBtn);

    // Auto-dismiss with pause on hover
    let timer = null;
    let remaining = duration;
    let startTime = Date.now();

    function startTimer() {
      startTime = Date.now();
      timer = setTimeout(() => {
        instance.dismiss(id);
      }, remaining);
    }

    function pauseTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        remaining -= Date.now() - startTime;
      }
    }

    const instance = {
      id,
      el: toastEl,
      timer,
      pauseTimer,
      startTimer
    };

    toastEl.addEventListener('mouseenter', pauseTimer);
    toastEl.addEventListener('mouseleave', startTimer);

    container.appendChild(toastEl);
    this.toasts.push(instance);

    startTimer();

    return id;
  }

  dismiss(id) {
    const idx = this.toasts.findIndex(t => t.id === id);
    if (idx === -1) return;

    const item = this.toasts[idx];
    if (item.timer) clearTimeout(item.timer);

    item.el.classList.add('toast--dismissing');
    item.el.addEventListener('transitionend', () => {
      if (item.el.parentNode) item.el.parentNode.removeChild(item.el);
    }, { once: true });

    // Fallback removal after 300ms
    setTimeout(() => {
      if (item.el.parentNode) item.el.parentNode.removeChild(item.el);
    }, 300);

    this.toasts.splice(idx, 1);
  }

  clear() {
    [...this.toasts].forEach(t => this.dismiss(t.id));
  }

  success(msg, opts = {}) {
    return this.show({ ...opts, message: msg, type: 'success' });
  }

  error(msg, opts = {}) {
    return this.show({ ...opts, message: msg, type: 'error' });
  }

  warning(msg, opts = {}) {
    return this.show({ ...opts, message: msg, type: 'warning' });
  }

  info(msg, opts = {}) {
    return this.show({ ...opts, message: msg, type: 'info' });
  }
}

export const toast = new ToastManager();
