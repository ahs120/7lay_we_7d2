// tests/db/seed.test.mjs
// Verifies seed data, idempotency, and demo data clearing.

import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb, closeDb } from '../../src/main/db/connection.js';
import { runMigrations } from '../../src/main/db/migrate.js';
import { createRepos } from '../../src/main/db/repositories/index.js';
import { runSeed } from '../../src/main/db/seed/index.js';

test('seed: initialization, idempotency, and demo data', async (t) => {
  const db = openDb(':memory:');
  await runMigrations(db);
  const repos = createRepos(db);

  await t.test('first seed initializes settings and demo menu/tables', () => {
    const res = runSeed(db, { repos });
    assert.equal(res.seeded, true);
    assert.equal(res.demo, true);

    // Settings
    assert.equal(repos.settings.get('restaurant_name_ar'), 'مطعم محمد فوزي');
    assert.equal(repos.settings.getInt('service_bp'), 1200);
    assert.equal(repos.settings.getInt('tax_bp'), 1400);

    // Demo data counts
    assert.equal(repos.categories.count(), 6);
    assert.equal(repos.tables.count(), 12);
    assert.ok(repos.items.count() >= 20);
  });

  await t.test('second seed is completely idempotent and changes nothing', () => {
    const res = runSeed(db, { repos });
    assert.equal(res.seeded, false);
    assert.equal(res.demo, false);

    assert.equal(repos.categories.count(), 6);
    assert.equal(repos.tables.count(), 12);
  });

  await t.test('clearDemo removes demo records', () => {
    repos.categories.clearDemo();
    repos.tables.clearDemo();

    assert.equal(repos.categories.count(), 0);
    assert.equal(repos.tables.count(), 0);
  });

  closeDb(db);
});
