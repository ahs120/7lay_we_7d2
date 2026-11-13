// src/main/db/migrate.js
// Migration runner.
//
// Rules (Contract §3.8 exception):
//   - Reads NNN_name.sql files from migrations/ in numeric order
//   - Each migration runs in a single BEGIN IMMEDIATE transaction
//   - Records version + name + SHA-256 checksum in schema_migrations
//   - If a migration file was already applied but its content changed → throws (do not modify applied migrations)
//   - If DB is newer than available migrations → throws (downgrade not supported)
//   - If new migrations exist and DB already has data → takes a pre-migrate backup first
//   - Gap/duplicate version detection

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

/** Compute SHA-256 hex of a string. */
function sha256(str) {
  return createHash('sha256').update(str, 'utf8').digest('hex');
}

/**
 * Discover migration files sorted by version number.
 * @returns {{ version: number, name: string, path: string, sql: string }[]}
 */
export function discoverMigrations() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d{3}_.+\.sql$/.test(f))
    .sort();

  const migrations = [];
  for (const file of files) {
    const version = parseInt(file.slice(0, 3), 10);
    const name = file.slice(4, -4); // strip NNN_ prefix and .sql suffix
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    migrations.push({ version, name, path: join(MIGRATIONS_DIR, file), sql });
  }

  // Validate: no gaps, no duplicates
  for (let i = 0; i < migrations.length; i++) {
    if (migrations[i].version !== i + 1) {
      throw new Error(
        `Migration version gap or duplicate: expected ${i + 1}, got ${migrations[i].version} (${migrations[i].name})`
      );
    }
  }

  return migrations;
}

/**
 * Run pending migrations on the given database.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {{ onBackup?: (reason: string) => Promise<void> }} [opts]
 * @returns {{ applied: number, skipped: number }}
 */
export async function runMigrations(db, opts = {}) {
  // Ensure schema_migrations table exists (bootstrap)
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     INTEGER PRIMARY KEY,
      name        TEXT    NOT NULL,
      checksum    TEXT    NOT NULL,
      applied_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )
  `);

  const available = discoverMigrations();
  const applied = db.prepare('SELECT version, name, checksum FROM schema_migrations ORDER BY version').all();

  // Check applied migrations haven't changed
  for (const row of applied) {
    const found = available.find(m => m.version === row.version);
    if (!found) {
      throw new Error(
        `DB has migration v${row.version} ("${row.name}") but the SQL file is missing. ` +
        'Never delete applied migration files.'
      );
    }
    const checksum = sha256(found.sql);
    if (checksum !== row.checksum) {
      throw new Error(
        `Migration v${row.version} ("${row.name}") has been modified after being applied. ` +
        'Never edit an applied migration file — create a new one instead.'
      );
    }
  }

  // Check for downgrade
  const maxApplied = applied.length > 0 ? Math.max(...applied.map(r => r.version)) : 0;
  const maxAvailable = available.length > 0 ? Math.max(...available.map(m => m.version)) : 0;
  if (maxApplied > maxAvailable) {
    throw new Error(
      `Database schema version (${maxApplied}) is newer than the application (${maxAvailable}). ` +
      'Please update the application.'
    );
  }

  const pending = available.filter(m => !applied.find(r => r.version === m.version));

  if (pending.length === 0) {
    return { applied: 0, skipped: applied.length };
  }

  // Pre-migrate backup if DB already has data
  if (applied.length > 0 && opts.onBackup) {
    await opts.onBackup(`pre-migrate-v${pending[0].version}`);
  }

  // Apply each pending migration in its own immediate transaction
  const insert = db.prepare(
    'INSERT INTO schema_migrations(version, name, checksum) VALUES(?, ?, ?)'
  );

  for (const migration of pending) {
    const checksum = sha256(migration.sql);
    const applyMigration = db.transaction(() => {
      db.exec(migration.sql);
      insert.run(migration.version, migration.name, checksum);
    });
    applyMigration();
  }

  return { applied: pending.length, skipped: applied.length };
}

/**
 * Returns the current schema version (highest applied migration version).
 * Returns 0 if no migrations have been applied.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {number}
 */
export function getSchemaVersion(db) {
  try {
    const row = db.prepare('SELECT MAX(version) as v FROM schema_migrations').get();
    return row?.v ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Returns the latest available migration version.
 * @returns {number}
 */
export function getLatestVersion() {
  const migrations = discoverMigrations();
  return migrations.length > 0 ? migrations[migrations.length - 1].version : 0;
}

