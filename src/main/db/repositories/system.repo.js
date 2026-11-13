// src/main/db/repositories/system.repo.js
// System introspection — used by tests and health checks.
// NO business logic here.

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createSystemRepo(db) {
  return {
    /** Returns all table names in the database. */
    getTableNames() {
      return db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all()
        .map(r => r.name);
    },

    /** Returns foreign key list for a given table. */
    getForeignKeys(tableName) {
      return db.prepare(`PRAGMA foreign_key_list(${tableName})`).all();
    },

    /** Run integrity_check and return result. */
    integrityCheck() {
      const rows = db.prepare('PRAGMA integrity_check').all();
      const ok = rows.length === 1 && rows[0].integrity_check === 'ok';
      return { ok, errors: ok ? [] : rows.map(r => r.integrity_check) };
    },

    /** Run foreign_key_check — returns violations (empty = good). */
    foreignKeyCheck() {
      return db.prepare('PRAGMA foreign_key_check').all();
    },

    /** Returns journal_mode. */
    getJournalMode() {
      return db.prepare('PRAGMA journal_mode').get().journal_mode;
    },

    /** Returns foreign_keys pragma value. */
    getForeignKeysEnabled() {
      return db.prepare('PRAGMA foreign_keys').get().foreign_keys === 1;
    },

    /** Returns DB file size in bytes. */
    getDbSizeBytes() {
      const { page_size } = db.prepare('PRAGMA page_size').get();
      const { page_count } = db.prepare('PRAGMA page_count').get();
      return page_size * page_count;
    },

    /** Returns schema version (max version in schema_migrations). */
    getSchemaVersion() {
      try {
        const row = db.prepare('SELECT MAX(version) as v FROM schema_migrations').get();
        return row?.v ?? 0;
      } catch { return 0; }
    }
  };
}

