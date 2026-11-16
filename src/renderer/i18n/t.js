// src/renderer/i18n/t.js
// Translation function — dot-notation key lookup in AR_FLAT.
// Supports parameter interpolation: t('key', { name: 'value' }) → replaces {{name}}.
// t() never throws — returns key on missing translation (with console.warn in dev).

import { AR_FLAT } from './ar.js';

/**
 * Translate a key with optional parameter interpolation.
 * @param {string} key — dot-notation key (e.g. 'app.name', 'errors.NOT_FOUND')
 * @param {Record<string, string|number>} [params] — interpolation params
 * @returns {string}
 */
export function t(key, params) {
  let val = AR_FLAT[key];

  if (val === undefined) {
    // Try direct property access for non-flattened keys
    val = resolveNested(key);
  }

  if (val === undefined) {
    if (typeof DEV !== 'undefined' && DEV) {
      console.warn(`t(): missing key "${key}"`);
    }
    return key;
  }

  if (typeof val !== 'string') {
    return String(val);
  }

  if (!params) return val;

  // Interpolate {{param}} placeholders
  return val.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    const v = params[name];
    return v !== undefined ? String(v) : `{{${name}}}`;
  });
}

/**
 * Translate with pluralization.
 * @param {string} key — base key; looks for key+'_zero', key+'_one', key+'_many'
 * @param {number} count
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
export function tn(key, count, params) {
  const allParams = { count, ...params };

  // Arabic plural rules: 0 = zero, 1 = one, 2 = two, 3-10 = few, 11-99 = many, else = other
  let suffix;
  if (count === 0) suffix = 'zero';
  else if (count === 1) suffix = 'one';
  else if (count === 2) suffix = 'two';
  else if (count >= 3 && count <= 10) suffix = 'few';
  else if (count >= 11 && count <= 99) suffix = 'many';
  else suffix = 'other';

  // Try suffixed key, fall back to plain key
  for (const s of [suffix, 'other', 'many', '']) {
    const k = s ? `${key}_${s}` : key;
    const val = AR_FLAT[k];
    if (val !== undefined) {
      return t(k, allParams);
    }
  }

  return t(key, allParams);
}

/**
 * Check if a translation key exists.
 * @param {string} key
 * @returns {boolean}
 */
export function hasKey(key) {
  return key in AR_FLAT || resolveNested(key) !== undefined;
}

/** Resolve a dot-notation key against the original nested object. */
function resolveNested(key) {
  // AR_FLAT already has all keys flattened, so this handles edge cases
  return AR_FLAT[key];
}
