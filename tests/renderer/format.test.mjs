// tests/renderer/format.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatMoney,
  parseMoney,
  formatPercentBps,
  normalizeDigits,
  formatNumber,
  formatDuration,
  formatBusinessDate
} from '../../src/renderer/utils/format.js';
import { t, tn, hasKey } from '../../src/renderer/i18n/t.js';

test('formatMoney: formats integer piasters with currency symbol', () => {
  assert.equal(formatMoney(1500), '15.00 ج.م');
  assert.equal(formatMoney(0), '0.00 ج.م');
  assert.equal(formatMoney(-0), '0.00 ج.م');
  assert.equal(formatMoney(50), '0.50 ج.م');
  assert.equal(formatMoney(5), '0.05 ج.م');
  assert.equal(formatMoney(10025), '100.25 ج.م');
  assert.equal(formatMoney(-1500), '-15.00 ج.م');
  assert.equal(formatMoney(1500, { showSymbol: false }), '15.00');
  assert.equal(formatMoney(1500, { showSign: true }), '+15.00 ج.م');
});

test('formatMoney: throws on non-integer or invalid input', () => {
  assert.throws(() => formatMoney('1500'), TypeError);
  assert.throws(() => formatMoney(15.5), TypeError);
  assert.throws(() => formatMoney(NaN), TypeError);
  assert.throws(() => formatMoney(Infinity), RangeError);
});

test('parseMoney: parses valid inputs to integer piasters', () => {
  assert.equal(parseMoney('15.00'), 1500);
  assert.equal(parseMoney('15'), 1500);
  assert.equal(parseMoney('0.5'), 50);
  assert.equal(parseMoney('0.05'), 5);
  // Arabic digits normalization
  assert.equal(parseMoney('١٥.٥٠'), 1550);
  assert.ok(Number.isNaN(parseMoney('invalid')));
});

test('formatPercentBps: formats basis points correctly', () => {
  assert.equal(formatPercentBps(1400), '14%');
  assert.equal(formatPercentBps(1450), '14.50%');
  assert.equal(formatPercentBps(0), '0%');
  assert.throws(() => formatPercentBps(14.5), TypeError);
});

test('normalizeDigits: converts Eastern Arabic digits to Latin', () => {
  assert.equal(normalizeDigits('٠١٢٣٤٥٦٧٨٩'), '0123456789');
  assert.equal(normalizeDigits('123'), '123');
});

test('formatDuration: formats seconds to HH:MM:SS or MM:SS', () => {
  assert.equal(formatDuration(45), '00:45');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(3665), '01:01:05');
  assert.equal(formatDuration(65, { forceHours: true }), '00:01:05');
});

test('formatBusinessDate: formats YYYY-MM-DD to DD/MM/YYYY', () => {
  assert.equal(formatBusinessDate('2026-11-16'), '16/11/2026');
  assert.equal(formatBusinessDate(''), '');
});

test('i18n t() and tn(): translations and interpolation', () => {
  assert.equal(t('app.name'), 'كاشير محمد فوزي');
  assert.equal(hasKey('app.name'), true);
  assert.equal(hasKey('nonexistent.key'), false);
  assert.equal(t('nonexistent.key'), 'nonexistent.key');

  // Interpolation
  assert.equal(t('table.page'), 'الصفحة');
});
