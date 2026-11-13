// src/main/db/repositories/payments.repo.js

import { nowUtc } from './_base.js';

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createPaymentsRepo(db) {
  return {
    findByOrder(orderId) {
      return db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY paid_at').all(orderId);
    },

    findByShift(shiftId) {
      return db.prepare('SELECT * FROM payments WHERE shift_id = ? ORDER BY paid_at').all(shiftId);
    },

    create({ order_id, shift_id, method, amount, reference = null, paid_by = null }) {
      const r = db.prepare(`
        INSERT INTO payments(order_id, shift_id, method, amount, reference, paid_by, paid_at)
        VALUES(?, ?, ?, ?, ?, ?, ?)
      `).run(order_id, shift_id, method, amount, reference, paid_by, nowUtc());
      return db.prepare('SELECT * FROM payments WHERE id = ?').get(r.lastInsertRowid);
    },

    sumByShift(shiftId) {
      return db.prepare(`
        SELECT method, SUM(amount) as total
        FROM payments WHERE shift_id = ?
        GROUP BY method
      `).all(shiftId);
    }
  };
}

