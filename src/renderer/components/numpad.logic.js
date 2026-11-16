// src/renderer/components/numpad.logic.js
// Pure numpad calculation logic — string accumulation, limits, conversions.

/**
 * @typedef {'integer'|'decimal'} NumpadMode
 */

/**
 * Apply a key press to current raw string input.
 * @param {string} currentRaw
 * @param {string} key - '0'-'9', '.', 'backspace', 'clear'
 * @param {object} [opts]
 * @param {NumpadMode} [opts.mode] - 'integer' or 'decimal'
 * @param {number} [opts.maxDigits] - maximum integer digits allowed
 * @param {number} [opts.maxDecimals] - maximum decimal digits allowed (for 'decimal' mode)
 * @returns {string} updated raw string
 */
export function applyKey(currentRaw = '', key, opts = {}) {
  const {
    mode = 'integer',
    maxDigits = 8,
    maxDecimals = 2
  } = opts;

  let raw = String(currentRaw ?? '');

  if (key === 'clear') {
    return '';
  }

  if (key === 'backspace') {
    return raw.slice(0, -1);
  }

  // Decimal point
  if (key === '.' || key === 'dot') {
    if (mode !== 'decimal') return raw; // Disallowed in integer mode
    if (raw.includes('.')) return raw;  // Already has decimal point
    if (raw === '') return '0.';
    return `${raw}.`;
  }

  // Digits 0-9
  if (/^[0-9]$/.test(key)) {
    // Leading zero handling
    if (raw === '0' && key === '0') return '0';
    if (raw === '0' && key !== '0') return key;

    if (raw.includes('.')) {
      const parts = raw.split('.');
      if (parts[1].length >= maxDecimals) return raw; // Exceeded max decimal places
      return `${raw}${key}`;
    } else {
      if (raw.length >= maxDigits) return raw; // Exceeded max integer digits
      return `${raw}${key}`;
    }
  }

  return raw;
}

/**
 * Convert raw string to numeric value according to mode.
 * @param {string} raw
 * @param {NumpadMode} mode
 * @returns {number}
 */
export function rawToValue(raw, mode = 'integer') {
  if (!raw || raw === '.') return 0;
  if (mode === 'integer') {
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : val;
  }
  const val = parseFloat(raw);
  return isNaN(val) ? 0 : val;
}

/**
 * Check if the input satisfies minimum length/value requirements.
 * @param {string} raw
 * @param {number} [minLength]
 * @returns {boolean}
 */
export function isComplete(raw, minLength = 1) {
  if (!raw) return false;
  return raw.length >= minLength;
}
