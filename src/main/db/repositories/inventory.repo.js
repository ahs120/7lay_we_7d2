// src/main/db/repositories/inventory.repo.js

import { nowUtc, transformRow, transformRows } from './_base.js';

const ITEM_BOOLS = ['is_active'];
const SUP_BOOLS  = ['is_active'];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createInventoryRepo(db) {
  return {
    // ── Stock Items ──────────────────────────────────────────────────────

    findAllStockItems({ includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM stock_items ORDER BY name_ar'
        : 'SELECT * FROM stock_items WHERE is_active = 1 ORDER BY name_ar';
      return transformRows(db.prepare(sql).all(), ITEM_BOOLS);
    },

    findStockItemById(id) {
      return transformRow(db.prepare('SELECT * FROM stock_items WHERE id = ?').get(id), ITEM_BOOLS);
    },

    createStockItem({ name_ar, unit, unit_size = 1, reorder_level = 0 }) {
      const now = nowUtc();
      const r = db.prepare(`
        INSERT INTO stock_items(name_ar, unit, unit_size, reorder_level, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?)
      `).run(name_ar, unit, unit_size, reorder_level, now, now);
      return this.findStockItemById(r.lastInsertRowid);
    },

    addMovement({ stock_item_id, shift_id = null, type, qty, reason = null, created_by = null }) {
      const now = nowUtc();
      db.prepare(`
        INSERT INTO stock_movements(stock_item_id, shift_id, type, qty, reason, created_by, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?)
      `).run(stock_item_id, shift_id, type, qty, reason, created_by, now);
      // Update current_qty
      db.prepare('UPDATE stock_items SET current_qty = current_qty + ?, updated_at = ? WHERE id = ?')
        .run(qty, now, stock_item_id);
    },

    // ── Suppliers ────────────────────────────────────────────────────────

    findAllSuppliers({ includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM suppliers ORDER BY name'
        : 'SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name';
      return transformRows(db.prepare(sql).all(), SUP_BOOLS);
    },

    createSupplier({ name, phone = null, notes = null }) {
      const r = db.prepare(`
        INSERT INTO suppliers(name, phone, notes, created_at) VALUES(?, ?, ?, ?)
      `).run(name, phone, notes, nowUtc());
      return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(r.lastInsertRowid);
    },

    // ── Purchases ────────────────────────────────────────────────────────

    createPurchase({ supplier_id = null, total, notes = null, created_by = null, items = [] }) {
      const createPurchase = db.transaction(() => {
        const now = nowUtc();
        const { lastInsertRowid: purchaseId } = db.prepare(`
          INSERT INTO purchases(supplier_id, total, notes, created_by, created_at)
          VALUES(?, ?, ?, ?, ?)
        `).run(supplier_id, total, notes, created_by, now);

        for (const item of items) {
          db.prepare(`
            INSERT INTO purchase_items(purchase_id, stock_item_id, qty, unit_cost, total_cost)
            VALUES(?, ?, ?, ?, ?)
          `).run(purchaseId, item.stock_item_id, item.qty, item.unit_cost, item.total_cost);
          // Update stock
          this.addMovement({
            stock_item_id: item.stock_item_id, type: 'in',
            qty: item.qty, reason: `purchase #${purchaseId}`, created_by
          });
        }
        return db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId);
      });
      return createPurchase();
    }
  };
}

