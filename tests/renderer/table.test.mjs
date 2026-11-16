// tests/renderer/table.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { sortRows, paginate, pageWindow } from '../../src/renderer/components/table.logic.js';

test('table.logic: sortRows sorting numbers and arabic strings', () => {
  const rows = [
    { id: 3, name: 'شاورما', price: 6500 },
    { id: 1, name: 'برجر', price: 8500 },
    { id: 2, name: 'بيتزا', price: 12000 }
  ];

  // Ascending number
  const sortedNumAsc = sortRows(rows, 'price', 'asc');
  assert.deepEqual(sortedNumAsc.map(r => r.id), [3, 1, 2]);

  // Descending number
  const sortedNumDesc = sortRows(rows, 'price', 'desc');
  assert.deepEqual(sortedNumDesc.map(r => r.id), [2, 1, 3]);

  // String sorting
  const sortedStr = sortRows(rows, 'name', 'asc');
  assert.equal(sortedStr[0].name, 'برجر');

  // None returns copy unchanged
  const sortedNone = sortRows(rows, 'price', 'none');
  assert.deepEqual(sortedNone.map(r => r.id), [3, 1, 2]);
});

test('table.logic: paginate slices rows correctly', () => {
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  assert.deepEqual(paginate(rows, 1, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(paginate(rows, 2, 5), [6, 7, 8, 9, 10]);
  assert.deepEqual(paginate(rows, 3, 5), [11, 12]);
  assert.deepEqual(paginate(rows, 4, 5), []);
});

test('table.logic: pageWindow computes pagination array with ellipses', () => {
  assert.deepEqual(pageWindow(1, 1), [1]);
  assert.deepEqual(pageWindow(1, 3), [1, 2, 3]);
  assert.deepEqual(pageWindow(1, 10), [1, 2, 3, '...', 10]);
  assert.deepEqual(pageWindow(5, 10), [1, '...', 4, 5, 6, '...', 10]);
  assert.deepEqual(pageWindow(10, 10), [1, '...', 8, 9, 10]);
});
