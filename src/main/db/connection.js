// src/main/db/connection.js
// Opens a better-sqlite3 database with the required PRAGMAs.
// PRAGMAs here are explicitly allowed by Contract §3.8 (exception).
//
// Exports:
//   openDb(dbPath)         → Database instance (read-write)
//   openReadonlyDb(dbPath) → Database instance (read-only)
//   closeDb(db)            → void

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';

// PRAGMAs applied to every read-write connection
const RW_PRAGMAS = [
  'PRAGMA journal_mode = WAL',
  'PRAGMA synchronous = FULL',
  'PRAGMA foreign_keys = ON',
  'PRAGMA busy_timeout = 5000',
  'PRAGMA cache_size = -8192',  // 8 MB page cache
  'PRAGMA temp_store = MEMORY'
];

// PRAGMAs for read-only connections
const RO_PRAGMAS = [
  'PRAGMA journal_mode = WAL',
  'PRAGMA foreign_keys = ON',
  'PRAGMA busy_timeout = 5000',
  'PRAGMA query_only = ON'
];

/**
 * Open a read-write database connection.
 * Creates parent directories if needed.
 *
 * @param {string} dbPath
 * @returns {import('better-sqlite3').Database}
 */
export function openDb(dbPath) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  for (const pragma of RW_PRAGMAS) {
    db.exec(pragma);
  }
  return db;
}

/**
 * Open a read-only database connection.
 * Does not create directories (file must exist).
 *
 * @param {string} dbPath
 * @returns {import('better-sqlite3').Database}
 */
export function openReadonlyDb(dbPath) {
  const db = new Database(dbPath, { readonly: true });
  for (const pragma of RO_PRAGMAS) {
    db.exec(pragma);
  }
  return db;
}

/**
 * Safely close a database connection.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function closeDb(db) {
  if (db && db.open) {
    try { db.close(); } catch { /* ignore */ }
  }
}

/**
 * Run PRAGMA integrity_check and return results.
 * Returns { ok: true } or { ok: false, errors: string[] }.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function integrityCheck(db) {
  const rows = db.prepare('PRAGMA integrity_check').all();
  if (rows.length === 1 && rows[0].integrity_check === 'ok') {
    return { ok: true };
  }
  return { ok: false, errors: rows.map(r => r.integrity_check) };
}

/**
 * Run PRAGMA foreign_key_check and return any violations.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {object[]} Empty array = no violations
 */
export function foreignKeyCheck(db) {
  return db.prepare('PRAGMA foreign_key_check').all();
}

