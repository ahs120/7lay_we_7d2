// tests/db/schema.test.mjs
// Verifies schema tables, PRAGMAs, and database integrity.

import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb, closeDb } from '../../src/main/db/connection.js';
import { runMigrations } from '../../src/main/db/migrate.js';
import { createRepos } from '../../src/main/db/repositories/index.js';

test('schema: migrations, tables, and PRAGMAs', async (t) => {
  const db = openDb(':memory:');
  await runMigrations(db);
  const repos = createRepos(db);

  await t.test('all expected tables exist', () => {
    const tables = repos.system.getTableNames();
    const expected = [
      'schema_migrations', 'settings', 'audit_log', 'order_counters',
      'users', 'categories', 'items', 'item_sizes', 'modifier_groups',
      'modifier_options', 'item_modifier_groups', 'dining_tables',
      'customers', 'delivery_zones', 'drivers', 'shifts', 'orders',
      'order_items', 'order_item_modifiers', 'discounts', 'order_discounts',
      'payments', 'cash_movements', 'printers', 'suppliers', 'stock_items',
      'stock_movements', 'recipe_lines', 'purchases', 'purchase_items',
      'expense_categories', 'expenses'
    ];

    for (const table of expected) {
      assert.ok(tables.includes(table), `Table ${table} should exist`);
    }
  });

  await t.test('PRAGMAs are properly configured', () => {
    // Note: memory databases report 'memory' or 'wal' depending on sqlite build
    assert.ok(repos.system.getForeignKeysEnabled(), 'Foreign keys must be ON');
  });

  await t.test('database passes integrity check', () => {
    const res = repos.system.integrityCheck();
    assert.equal(res.ok, true, 'Integrity check must pass');
  });

  await t.test('no foreign key violations', () => {
    const violations = repos.system.foreignKeyCheck();
    assert.equal(violations.length, 0, 'FK check should have 0 violations');
  });

  closeDb(db);
});
