// src/main/db/repositories/shifts.repo.js

import { nowUtc, transformRow, transformRows } from './_base.js';

const BOOL_FIELDS = [];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createShiftsRepo(db) {
  return {
    findById(id) {
      return db.prepare('SELECT * FROM shifts WHERE id = ?').get(id);
    },

    findOpen() {
      return db.prepare("SELECT * FROM shifts WHERE status = 'open'").get();
    },

    findRecent(limit = 10) {
      return db.prepare('SELECT * FROM shifts ORDER BY id DESC LIMIT ?').all(limit);
    },

    open({ opened_by, opening_cash = 0 }) {
      const now = nowUtc();
      const r = db.prepare(`
        INSERT INTO shifts(opened_by, opening_cash, opened_at) VALUES(?, ?, ?)
      `).run(opened_by, opening_cash, now);
      return this.findById(r.lastInsertRowid);
    },

    close(id, { closed_by, closing_cash, expected_cash, notes = null }) {
      const now = nowUtc();
      db.prepare(`
        UPDATE shifts
        SET status = 'closed', closed_by = ?, closing_cash = ?,
            expected_cash = ?, notes = ?, closed_at = ?
        WHERE id = ?
      `).run(closed_by, closing_cash, expected_cash, notes, now, id);
      return this.findById(id);
    },

    isOpen(id) {
      const row = db.prepare("SELECT status FROM shifts WHERE id = ?").get(id);
      return row?.status === 'open';
    }
  };
}

