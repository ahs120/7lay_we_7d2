// src/renderer/components/confirm.js
// Promise-based confirmation dialog.

import { h } from '../utils/dom.js';
import { modal } from './modal.js';
import { button } from './button.js';
import { icon } from './icon.js';
import { t } from '../i18n/t.js';

/**
 * @typedef {object} ConfirmOpts
 * @property {string} [title]
 * @property {string} [message]
 * @property {string} [confirmText]
 * @property {string} [cancelText]
 * @property {boolean} [danger] - styling as destructive action
 * @property {string} [icon]
 */

/**
 * Show a confirmation modal and return a promise resolving to boolean.
 * @param {ConfirmOpts} opts
 * @returns {Promise<boolean>}
 */
export function confirm(opts = {}) {
  const {
    title = t('confirm.title'),
    message = t('confirm.message'),
    confirmText = t('confirm.confirm_btn'),
    cancelText = t('confirm.cancel_btn'),
    danger = false,
    icon: iconName = danger ? 'triangle-exclamation-point' : 'circle-help'
  } = opts;

  return new Promise((resolve) => {
    let resolved = false;

    function finish(result) {
      if (!resolved) {
        resolved = true;
        m.close();
        resolve(result);
      }
    }

    const cancelBtn = button({
      text: cancelText,
      variant: 'secondary',
      onClick: () => finish(false)
    });

    const confirmBtn = button({
      text: confirmText,
      variant: danger ? 'danger' : 'primary',
      onClick: () => finish(true)
    });

    const bodyContent = h('div', { class: 'confirm-body' });
    if (iconName) {
      bodyContent.appendChild(
        icon(iconName, {
          size: '2.5rem',
          className: danger ? 'confirm-icon confirm-icon--danger' : 'confirm-icon'
        })
      );
    }
    bodyContent.appendChild(h('p', { class: 'confirm-message' }, message));

    const m = modal({
      title,
      content: bodyContent,
      footer: [cancelBtn.el, confirmBtn.el],
      size: 'sm',
      className: 'modal-confirm',
      onClose: () => finish(false)
    });

    m.open();
  });
}
