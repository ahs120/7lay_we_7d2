// src/main/db/repositories/settings.repo.js

import { nowUtc } from './_base.js';

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createSettingsRepo(db) {
  const getStmt  = db.prepare('SELECT value FROM settings WHERE key = ?');
  const setStmt  = db.prepare(`
    INSERT INTO settings(key, value, updated_at) VALUES(?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  const allStmt  = db.prepare('SELECT key, value, updated_at FROM settings');
  const delStmt  = db.prepare('DELETE FROM settings WHERE key = ?');

  return {
    get(key) {
      return getStmt.get(key)?.value ?? null;
    },

    getInt(key, defaultVal = 0) {
      const v = getStmt.get(key)?.value;
      if (v === null || v === undefined) return defaultVal;
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : defaultVal;
    },

    getBool(key, defaultVal = false) {
      const v = getStmt.get(key)?.value;
      if (v === null || v === undefined) return defaultVal;
      return v === '1' || v === 'true';
    },

    set(key, value) {
      setStmt.run(key, String(value), nowUtc());
    },

    setMany(pairs) {
      const setMany = db.transaction(() => {
        for (const [key, value] of Object.entries(pairs)) {
          setStmt.run(key, String(value), nowUtc());
        }
      });
      setMany();
    },

    delete(key) {
      delStmt.run(key);
    },

    all() {
      return allStmt.all();
    }
  };
}

