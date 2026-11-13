import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMoney,
  parseMoneyInput,
  normalizeDigits,
  todayCairoDate,
  setDigits
} from '../../src/renderer/utils/format.js';

test('formatMoney formatting values and symbols', () => {
  setDigits('western');
  assert.equal(formatMoney(0), '0.00 ج.م');
  assert.equal(formatMoney(5), '0.05 ج.م');
  assert.equal(formatMoney(125050), '1,250.50 ج.م');
  assert.equal(formatMoney(-125050), '-1,250.50 ج.م');
  assert.equal(formatMoney(100000000), '1,000,000.00 ج.م');
  assert.equal(formatMoney(125050, { symbol: false }), '1,250.50');

  // Throws on non-integer
  assert.throws(() => formatMoney(12.5), RangeError);
  assert.throws(() => formatMoney('1250'), RangeError);
  assert.throws(() => formatMoney(NaN), RangeError);
});

test('parseMoneyInput edge cases and validation', () => {
  // Eastern Arabic digits and comma
  assert.equal(parseMoneyInput('١٢٫٥'), 1250);
  assert.equal(parseMoneyInput('١٢٫٥٠'), 1250);
  assert.equal(parseMoneyInput('12.5'), 1250);
  assert.equal(parseMoneyInput('12,5'), 1250);
  assert.equal(parseMoneyInput('0'), 0);
  assert.equal(parseMoneyInput('0.05'), 5);

  // Rejects invalid decimals (> 2 decimals)
  assert.equal(parseMoneyInput('12.555'), null);
  assert.equal(parseMoneyInput(''), null);
  assert.equal(parseMoneyInput('abc'), null);
  assert.equal(parseMoneyInput('-50'), null);
  assert.equal(parseMoneyInput('12.3.4'), null);
});

test('normalizeDigits with Arabic and Persian digits', () => {
  assert.equal(normalizeDigits('٠١٢٣٤٥٦٧٨٩'), '0123456789');
  assert.equal(normalizeDigits('۰۱۲۳۴۵۶۷۸۹'), '0123456789');
  assert.equal(normalizeDigits('١٢٫٣٤'), '12.34');
  assert.equal(normalizeDigits('١٬٢٥٠'), '1,250');
});

test('todayCairoDate across UTC midnight boundary', () => {
  // 2026-11-12T23:30:00Z is 2026-11-13T01:30:00 in Africa/Cairo (UTC+2)
  const utcDateLate = new Date('2026-11-12T23:30:00Z');
  const cairoDate = todayCairoDate(utcDateLate);
  assert.equal(cairoDate, '2026-11-13');

  // 2026-11-13T00:30:00Z is 2026-11-13T02:30:00 in Cairo
  const utcDateEarly = new Date('2026-11-13T00:30:00Z');
  assert.equal(todayCairoDate(utcDateEarly), '2026-11-13');
});

