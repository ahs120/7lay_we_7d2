// tests/renderer/router.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseHash,
  buildHash,
  normalizePath,
  matchRoute
} from '../../src/renderer/router.logic.js';

test('router.logic: normalizePath formats paths with leading and no trailing slash', () => {
  assert.equal(normalizePath(''), '/');
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath('cashier'), '/cashier');
  assert.equal(normalizePath('/cashier/'), '/cashier');
  assert.equal(normalizePath('  /menu/  '), '/menu');
});

test('router.logic: parseHash extracts path and query dictionary', () => {
  assert.deepEqual(parseHash(''), { path: '/', query: {} });
  assert.deepEqual(parseHash('#/'), { path: '/', query: {} });
  assert.deepEqual(parseHash('#/cashier'), { path: '/cashier', query: {} });
  assert.deepEqual(parseHash('#/cashier?table=5&tab=order'), {
    path: '/cashier',
    query: { table: '5', tab: 'order' }
  });
});

test('router.logic: buildHash constructs valid hash with query parameters', () => {
  assert.equal(buildHash('/cashier'), '#/cashier');
  assert.equal(buildHash('cashier', { table: 5 }), '#/cashier?table=5');
  assert.equal(buildHash('/', { filter: 'all', page: 2 }), '#/?filter=all&page=2');
});

test('router.logic: matchRoute finds matching entry or returns null', () => {
  const routes = [
    { path: '/', page: 'home' },
    { path: '/cashier', page: 'cashier' },
    { path: '/styleguide', page: 'styleguide' }
  ];

  assert.equal(matchRoute(routes, '/')?.page, 'home');
  assert.equal(matchRoute(routes, '/cashier')?.page, 'cashier');
  assert.equal(matchRoute(routes, 'cashier/')?.page, 'cashier');
  assert.equal(matchRoute(routes, '/unknown'), null);
});
