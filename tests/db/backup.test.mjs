// tests/db/backup.test.mjs
// Verifies backup snapshotting, verification, auto-pruning, and restore staging.

import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync, mkdirSync, existsSync, readFileSync, unlinkSync } from 'node:fs';
import { openDb, closeDb } from '../../src/main/db/connection.js';
import { runMigrations } from '../../src/main/db/migrate.js';
import { createRepos } from '../../src/main/db/repositories/index.js';
import { createBackup, listBackups, stageRestore } from '../../src/main/services/backup.js';

test('backup: snapshot, pruning, and restore staging', async (t) => {
  const testDir = join(tmpdir(), `test-pos-backup-${Date.now()}`);
  const dbFile = join(testDir, 'pos.db');
  const backupDir = join(testDir, 'backups');
  mkdirSync(testDir, { recursive: true });

  const db = openDb(dbFile);
  await runMigrations(db);
  const repos = createRepos(db);

  repos.categories.create({ name_ar: 'قسم تجريبي' });

  await t.test('creates verified manual backup', async () => {
    const res = await createBackup(db, { type: 'manual', destDir: backupDir });
    assert.equal(res.ok, true);
    assert.ok(existsSync(res.path));
    assert.ok(res.size > 0);

    const list = listBackups(backupDir);
    assert.equal(list.length, 1);
    assert.equal(list[0].type, 'manual');
  });

  await t.test('auto backups are pruned to keep the last 10', async () => {
    // Generate 12 auto backups
    for (let i = 0; i < 12; i++) {
      await createBackup(db, { type: 'auto', destDir: backupDir, keepAuto: 10 });
    }

    const list = listBackups(backupDir);
    const autos = list.filter(b => b.type === 'auto');
    assert.equal(autos.length, 10, 'Must only keep 10 auto backups');

    // Manual backup is still preserved
    const manuals = list.filter(b => b.type === 'manual');
    assert.equal(manuals.length, 1, 'Manual backups must not be pruned');
  });

  await t.test('stages restore correctly with pre-restore backup', async () => {
    const latestBackup = listBackups(backupDir)[0];
    const res = await stageRestore(db, latestBackup.path);
    assert.equal(res.ok, true);

    // Prerestore backup was taken
    const list = listBackups(backupDir);
    const prerestores = list.filter(b => b.type === 'prerestore');
    assert.equal(prerestores.length, 1);
    // Clean up marker if written to user data
    const marker = join(testDir, 'restore.pending');
    if (existsSync(marker)) unlinkSync(marker);
    const defaultMarker = join(process.env.APPDATA || '', 'MohamedFawzyPOS-dev', 'restore.pending');
    if (existsSync(defaultMarker)) unlinkSync(defaultMarker);
  });

  closeDb(db);
  try { rmSync(testDir, { recursive: true, force: true }); } catch { /* ignore */ }
});
