// tests/renderer/shortcuts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseCombo,
  eventToCombo,
  isReserved,
  resolveActive,
  isEditableTarget
} from '../../src/renderer/services/shortcuts.logic.js';

test('shortcuts.logic: parseCombo normalizes key order and casing', () => {
  assert.equal(parseCombo('ctrl+s'), 'Ctrl+S');
  assert.equal(parseCombo('shift+alt+ctrl+f2'), 'Ctrl+Alt+Shift+F2');
  assert.equal(parseCombo('esc'), 'Escape');
  assert.equal(parseCombo('enter'), 'Enter');
  assert.equal(parseCombo('space'), 'Space');
  assert.equal(parseCombo(''), '');
});

test('shortcuts.logic: isReserved identifies reserved electron keys', () => {
  assert.equal(isReserved('F11'), true);
  assert.equal(isReserved('F12'), true);
  assert.equal(isReserved('Ctrl+R'), true);
  assert.equal(isReserved('F2'), false);
  assert.equal(isReserved('Ctrl+S'), false);
});

test('shortcuts.logic: eventToCombo handles KeyboardEvent with codes and keys', () => {
  const e1 = { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false, code: 'KeyS', key: 'س' };
  assert.equal(eventToCombo(e1), 'Ctrl+S'); // Arabic keyboard layout safe!

  const e2 = { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, code: 'F2', key: 'F2' };
  assert.equal(eventToCombo(e2), 'F2');

  const e3 = { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, code: 'Escape', key: 'Escape' };
  assert.equal(eventToCombo(e3), 'Escape');
});

test('shortcuts.logic: resolveActive respects context stack and editable suppression', () => {
  const entries = [
    { combo: 'F2', handler: () => 'global', context: 'global', allowInInputs: false, preventDefault: true },
    { combo: 'F2', handler: () => 'modal', context: 'modal', allowInInputs: false, preventDefault: true },
    { combo: 'Enter', handler: () => 'enter', context: 'global', allowInInputs: false, preventDefault: true },
    { combo: 'Ctrl+S', handler: () => 'save', context: 'global', allowInInputs: true, preventDefault: true }
  ];

  // In global context
  assert.equal(resolveActive(entries, ['global'], 'F2', false)?.handler(), 'global');

  // In modal context (modal overrides global)
  assert.equal(resolveActive(entries, ['global', 'modal'], 'F2', false)?.handler(), 'modal');

  // Inside editable element: allowInInputs:false suppressed
  assert.equal(resolveActive(entries, ['global'], 'Enter', true), null);

  // Inside editable element: allowInInputs:true allowed
  assert.equal(resolveActive(entries, ['global'], 'Ctrl+S', true)?.handler(), 'save');
});
