// src/renderer/components/numpad.js
// Touch-optimized on-screen Numpad component.
// Targets >= 64px for cashiers/touchscreens.

import { h, clear } from '../utils/dom.js';
import { icon } from './icon.js';
import { applyKey, rawToValue } from './numpad.logic.js';
import { t } from '../i18n/t.js';

/**
 * @typedef {object} NumpadOpts
 * @property {'integer'|'decimal'} [mode] - default 'integer'
 * @property {string} [initialValue]
 * @property {string} [label]
 * @property {(val: number, raw: string) => void} [onChange]
 * @property {(val: number, raw: string) => void} [onConfirm]
 * @property {() => void} [onCancel]
 * @property {number} [maxDigits]
 * @property {number} [maxDecimals]
 * @property {boolean} [showActions] - show confirm/cancel buttons
 * @property {string} [className]
 */

export function numpad(opts = {}) {
  const {
    mode = 'integer',
    initialValue = '',
    label = '',
    onChange = null,
    onConfirm = null,
    onCancel = null,
    maxDigits = 8,
    maxDecimals = 2,
    showActions = true,
    className = ''
  } = opts;

  let raw = String(initialValue ?? '');

  const wrapperClasses = ['numpad'];
  if (className) wrapperClasses.push(className);
  const el = h('div', { class: wrapperClasses.join(' '), role: 'region', 'aria-label': label || t('numpad.label_default') });

  // ── Display Header ──────────────────────────────────────────────────────────
  const displayWrap = h('div', { class: 'numpad__display' });
  if (label) {
    displayWrap.appendChild(h('div', { class: 'numpad__label' }, label));
  }
  const screenEl = h('div', { class: 'numpad__screen num ltr', 'aria-live': 'polite' }, raw || '0');
  displayWrap.appendChild(screenEl);
  el.appendChild(displayWrap);

  // ── Key grid ────────────────────────────────────────────────────────────────
  const gridEl = h('div', { class: 'numpad__grid' });

  function updateDisplay() {
    screenEl.textContent = raw || '0';
    if (onChange) {
      onChange(rawToValue(raw, mode), raw);
    }
  }

  function handleKey(key) {
    raw = applyKey(raw, key, { mode, maxDigits, maxDecimals });
    updateDisplay();
  }

  // 1-9 rows
  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    [mode === 'decimal' ? '.' : '', '0', 'backspace']
  ];

  for (const row of keys) {
    for (const k of row) {
      if (!k) {
        // Empty placeholder key
        gridEl.appendChild(h('div', { class: 'numpad__key numpad__key--blank', 'aria-hidden': 'true' }));
        continue;
      }

      let keyEl;
      if (k === 'backspace') {
        keyEl = h(
          'button',
          { type: 'button', class: 'numpad__key numpad__key--fn', 'aria-label': t('numpad.backspace') },
          icon('delete', { size: '1.5rem' })
        );
      } else {
        keyEl = h(
          'button',
          { type: 'button', class: 'numpad__key numpad__key--num num' },
          k
        );
      }

      keyEl.addEventListener('click', () => handleKey(k));
      gridEl.appendChild(keyEl);
    }
  }

  el.appendChild(gridEl);

  // ── Action buttons row ──────────────────────────────────────────────────────
  let clearBtn, cancelBtn, confirmBtn;
  if (showActions) {
    const actionsEl = h('div', { class: 'numpad__actions' });

    clearBtn = h(
      'button',
      { type: 'button', class: 'numpad__btn numpad__btn--clear' },
      t('numpad.clear')
    );
    clearBtn.addEventListener('click', () => handleKey('clear'));
    actionsEl.appendChild(clearBtn);

    if (onCancel) {
      cancelBtn = h(
        'button',
        { type: 'button', class: 'numpad__btn numpad__btn--cancel' },
        t('numpad.cancel')
      );
      cancelBtn.addEventListener('click', onCancel);
      actionsEl.appendChild(cancelBtn);
    }

    if (onConfirm) {
      confirmBtn = h(
        'button',
        { type: 'button', class: 'numpad__btn numpad__btn--confirm' },
        t('numpad.confirm')
      );
      confirmBtn.addEventListener('click', () => {
        onConfirm(rawToValue(raw, mode), raw);
      });
      actionsEl.appendChild(confirmBtn);
    }

    el.appendChild(actionsEl);
  }

  return {
    el,
    getValue() {
      return rawToValue(raw, mode);
    },
    getRaw() {
      return raw;
    },
    setValue(val) {
      raw = String(val ?? '');
      updateDisplay();
    },
    setRaw(str) {
      raw = String(str ?? '');
      updateDisplay();
    },
    clear() {
      raw = '';
      updateDisplay();
    },
    destroy() {
      // Event listeners on child elements cleaned up with garbage collection
    }
  };
}
