// src/main/db/repositories/items.repo.js

import { nowUtc, transformRow, transformRows, buildUpdateSet } from './_base.js';

const ITEM_BOOLS = ['has_sizes', 'service_exempt', 'tax_exempt', 'is_available', 'is_active', 'is_demo'];
const SIZE_BOOLS = ['is_active'];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createItemsRepo(db) {
  return {
    findAll({ categoryId, includeInactive = false } = {}) {
      let sql = 'SELECT * FROM items WHERE 1=1';
      const args = [];
      if (!includeInactive) { sql += ' AND is_active = 1'; }
      if (categoryId) { sql += ' AND category_id = ?'; args.push(categoryId); }
      sql += ' ORDER BY sort_order, name_ar';
      return transformRows(db.prepare(sql).all(...args), ITEM_BOOLS);
    },

    findById(id) {
      return transformRow(db.prepare('SELECT * FROM items WHERE id = ?').get(id), ITEM_BOOLS);
    },

    create({ category_id, name_ar, description_ar = null, base_price, has_sizes = 0,
             prep_station = 'kitchen', service_exempt = 0, tax_exempt = 0, sort_order = 0, is_demo = 0 }) {
      const now = nowUtc();
      const r = db.prepare(`
        INSERT INTO items(category_id, name_ar, description_ar, base_price, has_sizes,
          prep_station, service_exempt, tax_exempt, sort_order, is_demo, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(category_id, name_ar, description_ar, base_price, has_sizes ? 1 : 0,
             prep_station, service_exempt ? 1 : 0, tax_exempt ? 1 : 0,
             sort_order, is_demo ? 1 : 0, now, now);
      return this.findById(r.lastInsertRowid);
    },

    update(id, data) {
      const allowed = ['name_ar', 'description_ar', 'base_price', 'has_sizes',
        'prep_station', 'service_exempt', 'tax_exempt', 'is_available',
        'is_active', 'sort_order', 'category_id'];
      const { setClause, values } = buildUpdateSet(data, allowed);
      db.prepare(`UPDATE items SET ${setClause} WHERE id = ?`).run(...values, id);
      return this.findById(id);
    },

    // ── Sizes ────────────────────────────────────────────────────────────

    getSizes(itemId) {
      return transformRows(
        db.prepare('SELECT * FROM item_sizes WHERE item_id = ? ORDER BY sort_order').all(itemId),
        SIZE_BOOLS
      );
    },

    addSize(itemId, { name_ar, price, sort_order = 0 }) {
      const r = db.prepare(`
        INSERT INTO item_sizes(item_id, name_ar, price, sort_order) VALUES(?, ?, ?, ?)
      `).run(itemId, name_ar, price, sort_order);
      return db.prepare('SELECT * FROM item_sizes WHERE id = ?').get(r.lastInsertRowid);
    },

    updateSize(sizeId, { name_ar, price, sort_order, is_active }) {
      const fields = [];
      const vals = [];
      if (name_ar !== undefined)   { fields.push('name_ar = ?');   vals.push(name_ar); }
      if (price !== undefined)     { fields.push('price = ?');     vals.push(price); }
      if (sort_order !== undefined){ fields.push('sort_order = ?');vals.push(sort_order); }
      if (is_active !== undefined) { fields.push('is_active = ?'); vals.push(is_active ? 1 : 0); }
      if (fields.length === 0) return;
      db.prepare(`UPDATE item_sizes SET ${fields.join(', ')} WHERE id = ?`).run(...vals, sizeId);
    },

    count() {
      return db.prepare('SELECT COUNT(*) as n FROM items WHERE is_active = 1').get().n;
    }
  };
}

