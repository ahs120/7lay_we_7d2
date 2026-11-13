// src/main/db/repositories/dining-tables.repo.js

import { nowUtc, transformRow, transformRows, buildUpdateSet } from './_base.js';

const BOOL_FIELDS = ['is_active', 'is_demo'];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createDiningTablesRepo(db) {
  return {
    findAll({ includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM dining_tables ORDER BY sort_order, code'
        : 'SELECT * FROM dining_tables WHERE is_active = 1 ORDER BY sort_order, code';
      return transformRows(db.prepare(sql).all(), BOOL_FIELDS);
    },

    findById(id) {
      return transformRow(db.prepare('SELECT * FROM dining_tables WHERE id = ?').get(id), BOOL_FIELDS);
    },

    findByCode(code) {
      return transformRow(db.prepare('SELECT * FROM dining_tables WHERE code = ?').get(code), BOOL_FIELDS);
    },

    create({ code, name_ar = null, area = 'صالة', capacity = 4, sort_order = 0, is_demo = 0 }) {
      const now = nowUtc();
      const r = db.prepare(`
        INSERT INTO dining_tables(code, name_ar, area, capacity, sort_order, is_demo, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
      `).run(code, name_ar, area, capacity, sort_order, is_demo ? 1 : 0, now, now);
      return this.findById(r.lastInsertRowid);
    },

    updateStatus(id, status) {
      const now = nowUtc();
      db.prepare('UPDATE dining_tables SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
    },

    update(id, data) {
      const allowed = ['code', 'name_ar', 'area', 'capacity', 'status', 'is_active', 'sort_order'];
      const { setClause, values } = buildUpdateSet(data, allowed);
      db.prepare(`UPDATE dining_tables SET ${setClause} WHERE id = ?`).run(...values, id);
      return this.findById(id);
    },

    clearDemo() {
      db.prepare('DELETE FROM dining_tables WHERE is_demo = 1').run();
    },

    count() {
      return db.prepare('SELECT COUNT(*) as n FROM dining_tables WHERE is_active = 1').get().n;
    }
  };
}

