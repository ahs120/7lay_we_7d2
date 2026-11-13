// src/main/db/repositories/discounts.repo.js

import { nowUtc, transformRow, transformRows } from './_base.js';

const BOOL_FIELDS = ['is_active'];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createDiscountsRepo(db) {
  return {
    findAll({ includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM discounts ORDER BY name_ar'
        : 'SELECT * FROM discounts WHERE is_active = 1 ORDER BY name_ar';
      return transformRows(db.prepare(sql).all(), BOOL_FIELDS);
    },

    findById(id) {
      return transformRow(db.prepare('SELECT * FROM discounts WHERE id = ?').get(id), BOOL_FIELDS);
    },

    create({ name_ar, type, value }) {
      const r = db.prepare(`
        INSERT INTO discounts(name_ar, type, value, created_at) VALUES(?, ?, ?, ?)
      `).run(name_ar, type, value, nowUtc());
      return this.findById(r.lastInsertRowid);
    },

    applyToOrder({ order_id, discount_id = null, name_ar, type, value, amount, applied_by = null }) {
      const r = db.prepare(`
        INSERT INTO order_discounts(order_id, discount_id, name_ar, type, value, amount, applied_by)
        VALUES(?, ?, ?, ?, ?, ?, ?)
      `).run(order_id, discount_id, name_ar, type, value, amount, applied_by);
      return db.prepare('SELECT * FROM order_discounts WHERE id = ?').get(r.lastInsertRowid);
    }
  };
}

