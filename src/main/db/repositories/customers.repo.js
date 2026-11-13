// src/main/db/repositories/customers.repo.js

import { nowUtc, transformRow, transformRows, buildUpdateSet } from './_base.js';

const BOOL_FIELDS = ['is_active'];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createCustomersRepo(db) {
  return {
    findById(id) {
      return transformRow(db.prepare('SELECT * FROM customers WHERE id = ?').get(id), BOOL_FIELDS);
    },

    findByPhone(phone) {
      return transformRow(db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone), BOOL_FIELDS);
    },

    search(query, limit = 20) {
      return transformRows(
        db.prepare(`
          SELECT * FROM customers
          WHERE (name LIKE ? OR phone LIKE ?) AND is_active = 1
          ORDER BY name LIMIT ?
        `).all(`%${query}%`, `%${query}%`, limit),
        BOOL_FIELDS
      );
    },

    create({ name, phone, address = null, notes = null }) {
      const now = nowUtc();
      const r = db.prepare(`
        INSERT INTO customers(name, phone, address, notes, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?)
      `).run(name, phone, address, notes, now, now);
      return this.findById(r.lastInsertRowid);
    },

    update(id, data) {
      const allowed = ['name', 'phone', 'address', 'notes', 'is_active'];
      const { setClause, values } = buildUpdateSet(data, allowed);
      db.prepare(`UPDATE customers SET ${setClause} WHERE id = ?`).run(...values, id);
      return this.findById(id);
    }
  };
}

