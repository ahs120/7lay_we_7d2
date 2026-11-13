// tests/db/constraints.test.mjs
// Verifies SQL CHECK constraints and UNIQUE constraints via repository methods.

import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb, closeDb } from '../../src/main/db/connection.js';
import { runMigrations } from '../../src/main/db/migrate.js';
import { createRepos } from '../../src/main/db/repositories/index.js';

test('constraints: validations and integrity guards', async (t) => {
  const db = openDb(':memory:');
  await runMigrations(db);
  const repos = createRepos(db);

  // Setup basic prerequisites
  const owner = repos.users.create({
    name: 'المالك',
    username: 'owner',
    role: 'owner'
  });
  const cat = repos.categories.create({ name_ar: 'مشويات' });
  const table = repos.tables.create({ code: 'T1' });
  const shift = repos.shifts.open({ opened_by: owner.id });

  await t.test('base_price cannot be negative', () => {
    assert.throws(() => {
      repos.items.create({
        category_id: cat.id,
        name_ar: 'صنف خاطئ',
        base_price: -100
      });
    }, /CHECK constraint failed/);
  });

  await t.test('order item qty cannot be zero or negative', () => {
    assert.throws(() => {
      repos.orders.create({
        shift_id: shift.id,
        created_by: owner.id,
        order_type: 'takeaway',
        service_bp: 0,
        tax_bp: 0,
        items: [{
          name_ar: 'صنف',
          base_price: 1000,
          unit_price: 1000,
          qty: 0
        }]
      });
    }, /CHECK constraint failed/);
  });

  await t.test('dine_in order requires table_id', () => {
    assert.throws(() => {
      repos.orders.create({
        shift_id: shift.id,
        created_by: owner.id,
        order_type: 'dine_in',
        table_id: null,
        service_bp: 0,
        tax_bp: 0
      });
    }, /CHECK constraint failed/);
  });

  await t.test('delivery order requires delivery_address', () => {
    assert.throws(() => {
      repos.orders.create({
        shift_id: shift.id,
        created_by: owner.id,
        order_type: 'delivery',
        delivery_address: null,
        service_bp: 0,
        tax_bp: 0
      });
    }, /CHECK constraint failed/);
  });

  await t.test('service_bp cannot exceed 10000 (100%)', () => {
    assert.throws(() => {
      repos.orders.create({
        shift_id: shift.id,
        created_by: owner.id,
        order_type: 'takeaway',
        service_bp: 15000,
        tax_bp: 0
      });
    }, /CHECK constraint failed/);
  });

  await t.test('cannot open a second shift while one is open (UNIQUE index)', () => {
    assert.throws(() => {
      repos.shifts.open({ opened_by: owner.id });
    }, /UNIQUE constraint failed/);
  });

  await t.test('foreign key violations are rejected', () => {
    assert.throws(() => {
      repos.items.create({
        category_id: 99999, // Non-existent category
        name_ar: 'صنف يتيم',
        base_price: 1000
      });
    }, /FOREIGN KEY constraint failed/);
  });

  closeDb(db);
});
