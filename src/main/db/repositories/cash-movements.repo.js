// src/main/db/repositories/cash-movements.repo.js

import { nowUtc } from './_base.js';

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createCashMovementsRepo(db) {
  return {
    findByShift(shiftId) {
      return db.prepare('SELECT * FROM cash_movements WHERE shift_id = ? ORDER BY created_at').all(shiftId);
    },

    create({ shift_id, type, amount, reason, created_by = null }) {
      const r = db.prepare(`
        INSERT INTO cash_movements(shift_id, type, amount, reason, created_by, created_at)
        VALUES(?, ?, ?, ?, ?, ?)
      `).run(shift_id, type, amount, reason, created_by, nowUtc());
      return db.prepare('SELECT * FROM cash_movements WHERE id = ?').get(r.lastInsertRowid);
    },

    sumByShift(shiftId) {
      const rows = db.prepare(`
        SELECT type, SUM(amount) as total FROM cash_movements WHERE shift_id = ? GROUP BY type
      `).all(shiftId);
      const result = { in: 0, out: 0 };
      for (const r of rows) result[r.type] = r.total;
      return result;
    }
  };
}

