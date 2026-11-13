// src/main/db/repositories/audit.repo.js

import { nowUtc } from './_base.js';

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createAuditRepo(db) {
  const insertStmt = db.prepare(`
    INSERT INTO audit_log(ts, user_id, action, entity, entity_id, before_json, after_json, note)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return {
    log({ user_id = null, action, entity = null, entity_id = null,
          before = null, after = null, note = null }) {
      insertStmt.run(
        nowUtc(), user_id, action, entity, entity_id,
        before ? JSON.stringify(before) : null,
        after  ? JSON.stringify(after)  : null,
        note
      );
    },

    findRecent(limit = 50) {
      return db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?').all(limit);
    },

    findByEntity(entity, entityId) {
      return db.prepare('SELECT * FROM audit_log WHERE entity = ? AND entity_id = ? ORDER BY id DESC').all(entity, entityId);
    }
  };
}

