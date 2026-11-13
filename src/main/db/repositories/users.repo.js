// src/main/db/repositories/users.repo.js

import { nowUtc, transformRow, transformRows, buildUpdateSet } from './_base.js';

const BOOL_FIELDS = ['is_active'];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createUsersRepo(db) {
  return {
    findById(id) {
      return transformRow(
        db.prepare('SELECT * FROM users WHERE id = ?').get(id),
        BOOL_FIELDS
      );
    },

    findByUsername(username) {
      return transformRow(
        db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username),
        BOOL_FIELDS
      );
    },

    findAll({ includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM users ORDER BY name'
        : 'SELECT * FROM users WHERE is_active = 1 ORDER BY name';
      return transformRows(db.prepare(sql).all(), BOOL_FIELDS);
    },

    create({ name, username, pin_hash = null, role, permissions_json = '{}' }) {
      const now = nowUtc();
      const result = db.prepare(`
        INSERT INTO users(name, username, pin_hash, role, permissions_json, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?)
      `).run(name, username, pin_hash, role, permissions_json, now, now);
      return this.findById(result.lastInsertRowid);
    },

    update(id, data) {
      const allowed = ['name', 'username', 'pin_hash', 'role', 'permissions_json', 'is_active'];
      const { setClause, values } = buildUpdateSet(data, allowed);
      db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, id);
      return this.findById(id);
    },

    deactivate(id) {
      return this.update(id, { is_active: 0 });
    },

    count() {
      return db.prepare('SELECT COUNT(*) as n FROM users').get().n;
    }
  };
}

