// src/main/db/repositories/categories.repo.js

import { nowUtc, transformRow, transformRows, buildUpdateSet } from './_base.js';

const BOOL_FIELDS = ['is_active', 'is_demo'];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createCategoriesRepo(db) {
  return {
    findAll({ includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM categories ORDER BY sort_order, name_ar'
        : 'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name_ar';
      return transformRows(db.prepare(sql).all(), BOOL_FIELDS);
    },

    findById(id) {
      return transformRow(db.prepare('SELECT * FROM categories WHERE id = ?').get(id), BOOL_FIELDS);
    },

    create({ name_ar, sort_order = 0, is_demo = 0 }) {
      const now = nowUtc();
      const r = db.prepare(`
        INSERT INTO categories(name_ar, sort_order, is_demo, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?)
      `).run(name_ar, sort_order, is_demo ? 1 : 0, now, now);
      return this.findById(r.lastInsertRowid);
    },

    update(id, data) {
      const allowed = ['name_ar', 'sort_order', 'is_active', 'is_demo'];
      const { setClause, values } = buildUpdateSet(data, allowed);
      db.prepare(`UPDATE categories SET ${setClause} WHERE id = ?`).run(...values, id);
      return this.findById(id);
    },

    /** Remove all demo categories and their items. */
    clearDemo() {
      const clear = db.transaction(() => {
        db.prepare('DELETE FROM items WHERE is_demo = 1').run();
        db.prepare('DELETE FROM categories WHERE is_demo = 1').run();
      });
      clear();
    },

    count() {
      return db.prepare('SELECT COUNT(*) as n FROM categories WHERE is_active = 1').get().n;
    }
  };
}

