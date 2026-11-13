// src/main/db/repositories/expenses.repo.js

import { nowUtc, transformRow, transformRows } from './_base.js';

const CAT_BOOLS = ['is_active'];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createExpensesRepo(db) {
  return {
    findAllCategories({ includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM expense_categories ORDER BY name_ar'
        : 'SELECT * FROM expense_categories WHERE is_active = 1 ORDER BY name_ar';
      return transformRows(db.prepare(sql).all(), CAT_BOOLS);
    },

    createCategory({ name_ar }) {
      const r = db.prepare('INSERT INTO expense_categories(name_ar) VALUES(?)').run(name_ar);
      return transformRow(
        db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(r.lastInsertRowid),
        CAT_BOOLS
      );
    },

    findByShift(shiftId) {
      return db.prepare('SELECT * FROM expenses WHERE shift_id = ? ORDER BY created_at').all(shiftId);
    },

    create({ category_id = null, shift_id = null, amount, description, created_by = null }) {
      const r = db.prepare(`
        INSERT INTO expenses(category_id, shift_id, amount, description, created_by, created_at)
        VALUES(?, ?, ?, ?, ?, ?)
      `).run(category_id, shift_id, amount, description, created_by, nowUtc());
      return db.prepare('SELECT * FROM expenses WHERE id = ?').get(r.lastInsertRowid);
    },

    sumByShift(shiftId) {
      return db.prepare('SELECT SUM(amount) as total FROM expenses WHERE shift_id = ?').get(shiftId).total ?? 0;
    }
  };
}

