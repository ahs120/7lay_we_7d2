// tests/renderer/numpad.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { applyKey, rawToValue, isComplete } from '../../src/renderer/components/numpad.logic.js';

test('numpad.logic: integer accumulation', () => {
  let raw = '';
  raw = applyKey(raw, '1', { mode: 'integer' });
  assert.equal(raw, '1');
  raw = applyKey(raw, '5', { mode: 'integer' });
  assert.equal(raw, '15');
  raw = applyKey(raw, '0', { mode: 'integer' });
  assert.equal(raw, '150');

  // Backspace
  raw = applyKey(raw, 'backspace', { mode: 'integer' });
  assert.equal(raw, '15');

  // Clear
  raw = applyKey(raw, 'clear', { mode: 'integer' });
  assert.equal(raw, '');
});

test('numpad.logic: decimal mode limits dots and decimal places', () => {
  let raw = '';
  raw = applyKey(raw, '.', { mode: 'decimal' });
  assert.equal(raw, '0.');

  raw = applyKey(raw, '5', { mode: 'decimal' });
  assert.equal(raw, '0.5');

  raw = applyKey(raw, '0', { mode: 'decimal' });
  assert.equal(raw, '0.50');

  // Exceed maxDecimals = 2
  raw = applyKey(raw, '9', { mode: 'decimal', maxDecimals: 2 });
  assert.equal(raw, '0.50');

  // Second dot ignored
  raw = applyKey(raw, '.', { mode: 'decimal' });
  assert.equal(raw, '0.50');
});

test('numpad.logic: rawToValue conversions', () => {
  assert.equal(rawToValue('150', 'integer'), 150);
  assert.equal(rawToValue('', 'integer'), 0);
  assert.equal(rawToValue('15.5', 'decimal'), 15.5);
  assert.equal(rawToValue('', 'decimal'), 0);
});

test('numpad.logic: isComplete validates input length', () => {
  assert.equal(isComplete('', 1), false);
  assert.equal(isComplete('1', 1), true);
  assert.equal(isComplete('123', 4), false);
  assert.equal(isComplete('1234', 4), true);
});
