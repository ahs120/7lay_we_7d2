// src/renderer/components/money.js
// Money, number, and LTR DOM display helpers.
// No innerHTML, no inline styles.

import { h } from '../utils/dom.js';
import { formatMoney, formatNumber } from '../utils/format.js';

/**
 * Create a DOM span element displaying formatted money.
 * @param {number} piasters - integer piasters
 * @param {object} [opts]
 * @param {boolean} [opts.showSymbol] - default true
 * @param {boolean} [opts.showSign] - show + for positive
 * @param {string} [opts.className] - additional class
 * @returns {HTMLSpanElement}
 */
export function moneyEl(piasters, opts = {}) {
  const { className = '', ...formatOpts } = opts;
  const text = formatMoney(piasters, formatOpts);
  const classes = ['num', 'money-el'];
  if (className) classes.push(className);

  return h('span', { class: classes.join(' ') }, text);
}

/**
 * Create a DOM span element displaying formatted number in LTR/tabular digits.
 * @param {number} value
 * @param {Intl.NumberFormatOptions & { className?: string }} [opts]
 * @returns {HTMLSpanElement}
 */
export function numEl(value, opts = {}) {
  const { className = '', ...formatOpts } = opts;
  const text = formatNumber(value, formatOpts);
  const classes = ['num'];
  if (className) classes.push(className);

  return h('span', { class: classes.join(' ') }, text);
}

/**
 * Create a DOM span element forced to LTR direction (for codes, phone numbers, paths).
 * @param {string} text
 * @param {string} [className]
 * @returns {HTMLSpanElement}
 */
export function ltrEl(text, className = '') {
  const classes = ['ltr'];
  if (className) classes.push(className);

  return h('span', { class: classes.join(' ') }, String(text));
}
