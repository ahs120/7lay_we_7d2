// src/main/db/repositories/delivery.repo.js

import { nowUtc, transformRow, transformRows } from './_base.js';

const ZONE_BOOLS   = ['is_active'];
const DRIVER_BOOLS = ['is_active'];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createDeliveryRepo(db) {
  return {
    // ── Zones ────────────────────────────────────────────────────────────

    findAllZones({ includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM delivery_zones ORDER BY sort_order, name_ar'
        : 'SELECT * FROM delivery_zones WHERE is_active = 1 ORDER BY sort_order, name_ar';
      return transformRows(db.prepare(sql).all(), ZONE_BOOLS);
    },

    createZone({ name_ar, fee = 0, sort_order = 0 }) {
      const r = db.prepare(`
        INSERT INTO delivery_zones(name_ar, fee, sort_order) VALUES(?, ?, ?)
      `).run(name_ar, fee, sort_order);
      return db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(r.lastInsertRowid);
    },

    // ── Drivers ──────────────────────────────────────────────────────────

    findAllDrivers({ includeInactive = false } = {}) {
      const sql = includeInactive
        ? 'SELECT * FROM drivers ORDER BY name'
        : 'SELECT * FROM drivers WHERE is_active = 1 ORDER BY name';
      return transformRows(db.prepare(sql).all(), DRIVER_BOOLS);
    },

    createDriver({ name, phone = null }) {
      const r = db.prepare(`
        INSERT INTO drivers(name, phone, created_at) VALUES(?, ?, ?)
      `).run(name, phone, nowUtc());
      return transformRow(
        db.prepare('SELECT * FROM drivers WHERE id = ?').get(r.lastInsertRowid),
        DRIVER_BOOLS
      );
    }
  };
}

