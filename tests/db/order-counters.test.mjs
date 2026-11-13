// tests/db/order-counters.test.mjs
// Verifies atomic order numbering with RETURNING, concurrency, and scope resetting.

import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlinkSync, existsSync } from 'node:fs';
import { openDb, closeDb } from '../../src/main/db/connection.js';
import { runMigrations } from '../../src/main/db/migrate.js';
import { createOrderCountersRepo } from '../../src/main/db/repositories/order-counters.repo.js';

test('order-counters: sequential and collision-free order numbering', async (t) => {
  const testDbFile = join(tmpdir(), `test-order-counters-${Date.now()}.db`);

  // Connection 1: migrate
  const db1 = openDb(testDbFile);
  await runMigrations(db1);
  const counters1 = createOrderCountersRepo(db1);

  // Connection 2 to the SAME database file
  const db2 = openDb(testDbFile);
  const counters2 = createOrderCountersRepo(db2);

  await t.test('consecutive numbers across two connections', () => {
    const scope = 'D:2026-11-13';
    const numbers = [];

    // Assign 200 numbers alternating between db1 and db2
    for (let i = 0; i < 200; i++) {
      const c = (i % 2 === 0) ? counters1 : counters2;
      numbers.push(c.nextNo(scope));
    }

    // Verify all 200 numbers are consecutive: 1, 2, ..., 200
    assert.equal(numbers.length, 200);
    assert.equal(numbers[0], 1);
    assert.equal(numbers[199], 200);

    const set = new Set(numbers);
    assert.equal(set.size, 200, 'All 200 allocated numbers must be unique');
  });

  await t.test('new scope starts from 1', () => {
    const scopeA = 'D:2026-11-13';
    const scopeB = 'D:2026-11-14';

    const numA = counters1.getCurrent(scopeA);
    assert.equal(numA, 200);

    const numB = counters1.nextNo(scopeB);
    assert.equal(numB, 1, 'New scope must start at 1');
  });

  closeDb(db1);
  closeDb(db2);

  for (const ext of ['', '-wal', '-shm']) {
    const p = `${testDbFile}${ext}`;
    if (existsSync(p)) unlinkSync(p);
  }
});
