// src/main/db/repositories/modifiers.repo.js

import { nowUtc, transformRow, transformRows } from './_base.js';

const GROUP_BOOLS = ['is_required', 'is_active'];
const OPT_BOOLS   = ['is_active'];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createModifiersRepo(db) {
  return {
    // ── Groups ──────────────────────────────────────────────────────────

    findAllGroups({ includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM modifier_groups ORDER BY sort_order, name_ar'
        : 'SELECT * FROM modifier_groups WHERE is_active = 1 ORDER BY sort_order, name_ar';
      return transformRows(db.prepare(sql).all(), GROUP_BOOLS);
    },

    findGroupById(id) {
      return transformRow(db.prepare('SELECT * FROM modifier_groups WHERE id = ?').get(id), GROUP_BOOLS);
    },

    createGroup({ name_ar, min_select = 0, max_select = 1, is_required = 0, sort_order = 0 }) {
      const now = nowUtc();
      const r = db.prepare(`
        INSERT INTO modifier_groups(name_ar, min_select, max_select, is_required, sort_order, created_at)
        VALUES(?, ?, ?, ?, ?, ?)
      `).run(name_ar, min_select, max_select, is_required ? 1 : 0, sort_order, now);
      return this.findGroupById(r.lastInsertRowid);
    },

    // ── Options ─────────────────────────────────────────────────────────

    findOptions(groupId, { includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM modifier_options WHERE group_id = ? ORDER BY sort_order'
        : 'SELECT * FROM modifier_options WHERE group_id = ? AND is_active = 1 ORDER BY sort_order';
      return transformRows(db.prepare(sql).all(groupId), OPT_BOOLS);
    },

    addOption(groupId, { name_ar, price_delta = 0, sort_order = 0 }) {
      const r = db.prepare(`
        INSERT INTO modifier_options(group_id, name_ar, price_delta, sort_order) VALUES(?, ?, ?, ?)
      `).run(groupId, name_ar, price_delta, sort_order);
      return db.prepare('SELECT * FROM modifier_options WHERE id = ?').get(r.lastInsertRowid);
    },

    // ── Item↔Group links ────────────────────────────────────────────────

    getGroupsForItem(itemId) {
      return transformRows(db.prepare(`
        SELECT mg.*, img.sort_order as link_order
        FROM modifier_groups mg
        JOIN item_modifier_groups img ON img.group_id = mg.id
        WHERE img.item_id = ? AND mg.is_active = 1
        ORDER BY img.sort_order, mg.sort_order
      `).all(itemId), GROUP_BOOLS);
    },

    linkGroupToItem(itemId, groupId, sortOrder = 0) {
      db.prepare(`
        INSERT OR IGNORE INTO item_modifier_groups(item_id, group_id, sort_order)
        VALUES(?, ?, ?)
      `).run(itemId, groupId, sortOrder);
    }
  };
}

