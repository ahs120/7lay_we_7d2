// src/renderer/components/numpad-dialog.js
// Modal dialog wrapping the touch numpad component.

import { modal } from './modal.js';
import { numpad } from './numpad.js';
import { t } from '../i18n/t.js';

/**
 * @typedef {object} NumpadDialogOpts
 * @property {string} [title]
 * @property {number|string} [initialValue]
 * @property {'integer'|'decimal'} [mode]
 * @property {number} [maxDigits]
 * @property {number} [maxDecimals]
 */

/**
 * Show a numpad dialog and return a promise resolving to number or null on cancel.
 * @param {NumpadDialogOpts} opts
 * @returns {Promise<number | null>}
 */
export function numpadDialog(opts = {}) {
  const {
    title = t('numpad.enter'),
    initialValue = '',
    mode = 'integer',
    maxDigits = 8,
    maxDecimals = 2
  } = opts;

  return new Promise((resolve) => {
    let settled = false;

    function finish(val) {
      if (!settled) {
        settled = true;
        m.close();
        resolve(val);
      }
    }

    const pad = numpad({
      mode,
      initialValue: String(initialValue ?? ''),
      maxDigits,
      maxDecimals,
      showActions: true,
      onConfirm: (val) => finish(val),
      onCancel: () => finish(null)
    });

    const m = modal({
      title,
      content: pad.el,
      size: 'sm',
      className: 'modal-numpad',
      onClose: () => finish(null)
    });

    m.open();
  });
}
