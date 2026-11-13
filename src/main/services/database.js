// src/main/services/database.js
// Central database lifecycle manager.
//
// Boot sequence:
//   1. Check & apply pending restore (swap-at-boot)
//   2. Open database with strict PRAGMAs (WAL, foreign_keys, busy_timeout)
//   3. Run PRAGMA integrity_check. If corrupted, rename file and abort.
//   4. Run migrations with automatic pre-migration backup.
//   5. Initialize repositories.
//   6. Run idempotent seed (settings + demo menu/tables).

import { existsSync, renameSync } from 'node:fs';
import { openDb, closeDb, integrityCheck } from '../db/connection.js';
import { getDbPath } from '../db/paths.js';
import { runMigrations, getSchemaVersion, getLatestVersion } from '../db/migrate.js';
import { createRepos } from '../db/repositories/index.js';
import { runSeed } from '../db/seed/index.js';
import { applyPendingRestoreIfExists, createBackup } from './backup.js';
import { log } from './logger.js';

/** @type {import('better-sqlite3').Database | null} */
let _db = null;

/** @type {ReturnType<import('../db/repositories/index.js').createRepos> | null} */
let _repos = null;

let _lastIntegrityCheck = null;

/**
 * Initialize database and return repos.
 *
 * @param {object} [opts]
 * @param {string} [opts.dbPath] - Optional override
 * @param {boolean} [opts.skipSeed=false]
 * @returns {Promise<{ db: import('better-sqlite3').Database, repos: ReturnType<import('../db/repositories/index.js').createRepos> }>}
 */
export async function initDatabase({ dbPath = null, skipSeed = false } = {}) {
  const targetPath = dbPath || getDbPath();

  // 1. Apply any pending restore before opening database
  if (!dbPath) {
    applyPendingRestoreIfExists();
  }

  log.info(`Opening database at: ${targetPath}`);
  _db = openDb(targetPath);

  // 2. Integrity check on boot
  const integrity = integrityCheck(_db);
  _lastIntegrityCheck = integrity;
  if (!integrity.ok) {
    closeDb(_db);
    _db = null;
    const corruptPath = `${targetPath}.corrupt-${Date.now()}`;
    if (existsSync(targetPath)) {
      renameSync(targetPath, corruptPath);
    }
    const err = new Error(
      `Database integrity check failed: ${integrity.errors.join(', ')}. ` +
      `File was renamed to ${corruptPath}. Please restore from a recent backup.`
    );
    log.error(err.message);
    throw err;
  }

  // 3. Migrations with auto pre-migrate backup
  await runMigrations(_db, {
    onBackup: async (reason) => {
      try {
        await createBackup(_db, { type: 'premigrate' });
      } catch (err) {
        log.warn(`Pre-migration backup failed (${reason}):`, err);
      }
    }
  });

  // 4. Create Repositories
  _repos = createRepos(_db);

  // 5. Idempotent seed
  if (!skipSeed) {
    runSeed(_db, { repos: _repos });
  }

  log.info('Database initialized successfully');
  return { db: _db, repos: _repos };
}

/**
 * Returns current DB instance.
 */
export function getDb() {
  if (!_db || !_db.open) {
    throw new Error('Database is not initialized or has been closed');
  }
  return _db;
}

/**
 * Returns current Repos instance.
 */
export function getRepos() {
  if (!_repos) {
    throw new Error('Repositories are not initialized');
  }
  return _repos;
}

/**
 * Safely close the database connection.
 */
export function closeDatabase() {
  if (_db) {
    closeDb(_db);
    _db = null;
    _repos = null;
    log.info('Database closed');
  }
}

/**
 * Returns database health and metadata.
 */
export function getDbHealth() {
  if (!_db || !_db.open || !_repos) {
    return {
      ok: false,
      error: 'Database not initialized'
    };
  }

  try {
    const sys = _repos.system;
    const schemaVersion = sys.getSchemaVersion();
    const latestVersion = getLatestVersion();
    const journalMode = sys.getJournalMode();
    const foreignKeys = sys.getForeignKeysEnabled();
    const dbSizeBytes = sys.getDbSizeBytes();
    const seeded = Boolean(_repos.settings.get('system.seeded_at'));

    return {
      ok: true,
      schemaVersion,
      latestVersion,
      journalMode,
      foreignKeys,
      integrity: _lastIntegrityCheck?.ok ? 'ok' : (_lastIntegrityCheck?.errors?.join(', ') || 'ok'),
      dbSizeBytes,
      seeded
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message
    };
  }
}
