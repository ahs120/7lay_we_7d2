// src/main/db/repositories/orders.repo.js
// Order creation includes atomic order numbering in the same transaction.

import { nowUtc } from './_base.js';

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ counters: ReturnType<import('./order-counters.repo.js').createOrderCountersRepo> }} deps
 */
export function createOrdersRepo(db, { counters }) {
  // ── Statements ─────────────────────────────────────────────────────────

  const findByIdStmt = db.prepare('SELECT * FROM orders WHERE id = ?');

  const insertOrderStmt = db.prepare(`
    INSERT INTO orders(
      shift_id, table_id, customer_id, driver_id, created_by,
      order_type, order_scope, order_no,
      service_bp, tax_bp, tax_inclusive,
      subtotal, service_amount, tax_amount, discount_total, delivery_fee, rounding, total,
      delivery_address, notes, business_date, created_at, updated_at
    ) VALUES(
      @shift_id, @table_id, @customer_id, @driver_id, @created_by,
      @order_type, @order_scope, @order_no,
      @service_bp, @tax_bp, @tax_inclusive,
      0, 0, 0, 0, @delivery_fee, 0, 0,
      @delivery_address, @notes, @business_date, @created_at, @updated_at
    )
  `);

  const insertItemStmt = db.prepare(`
    INSERT INTO order_items(
      order_id, item_id, size_id, name_ar, size_name_ar,
      unit_price, base_price, modifiers_total, qty, line_total,
      service_exempt, tax_exempt, prep_station, notes, created_at, updated_at
    ) VALUES(
      @order_id, @item_id, @size_id, @name_ar, @size_name_ar,
      @unit_price, @base_price, @modifiers_total, @qty, @line_total,
      @service_exempt, @tax_exempt, @prep_station, @notes, @created_at, @updated_at
    )
  `);

  const insertModStmt = db.prepare(`
    INSERT INTO order_item_modifiers(
      order_item_id, option_id, group_name_ar, option_name_ar, price_delta, qty
    ) VALUES(?, ?, ?, ?, ?, ?)
  `);

  const updateTotalsStmt = db.prepare(`
    UPDATE orders
    SET subtotal = ?, service_amount = ?, tax_amount = ?,
        discount_total = ?, delivery_fee = ?, rounding = ?, total = ?,
        updated_at = ?
    WHERE id = ?
  `);

  const updateStatusStmt = db.prepare(`
    UPDATE orders SET status = ?, cancel_reason = ?, updated_at = ? WHERE id = ?
  `);

  // ── Business date helper ────────────────────────────────────────────────

  /**
   * Returns business date string 'YYYY-MM-DD' in Africa/Cairo timezone,
   * accounting for day_start_hour (orders before that hour count as previous day).
   */
  function getBusinessDate(dayStartHour = 5) {
    // Use Intl to get Cairo local time
    const now = new Date();
    const cairoStr = now.toLocaleString('en-CA', { timeZone: 'Africa/Cairo', hour12: false });
    // cairoStr format: "2026-11-13, 06:30:00"
    const [datePart, timePart] = cairoStr.split(', ');
    const hour = parseInt(timePart.split(':')[0], 10);
    if (hour < dayStartHour) {
      // Subtract one day
      const d = new Date(datePart + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().slice(0, 10);
    }
    return datePart;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  return {
    findById(id) {
      return findByIdStmt.get(id);
    },

    findByShift(shiftId, { status } = {}) {
      let sql = 'SELECT * FROM orders WHERE shift_id = ?';
      const args = [shiftId];
      if (status) { sql += ' AND status = ?'; args.push(status); }
      sql += ' ORDER BY id DESC';
      return db.prepare(sql).all(...args);
    },

    findByDate(businessDate) {
      return db.prepare('SELECT * FROM orders WHERE business_date = ? ORDER BY order_no').all(businessDate);
    },

    /**
     * Create a new order with items in a single transaction.
     * Atomically assigns the order number.
     *
     * @param {{
     *   shift_id, table_id?, customer_id?, driver_id?, created_by,
     *   order_type, service_bp, tax_bp, tax_inclusive?,
     *   delivery_fee?, delivery_address?, notes?,
     *   items: Array<{
     *     item_id?, size_id?, name_ar, size_name_ar?,
     *     base_price, modifiers_total?, unit_price, qty,
     *     service_exempt?, tax_exempt?, prep_station?, notes?,
     *     modifiers?: Array<{option_id?, group_name_ar, option_name_ar, price_delta?, qty?}>
     *   }>,
     *   order_no_scope?,   // 'day' | 'shift' — defaults to 'day'
     *   day_start_hour?    // defaults to 5
     * }} params
     */
    create(params) {
      const {
        shift_id, table_id = null, customer_id = null, driver_id = null, created_by,
        order_type, service_bp, tax_bp, tax_inclusive = 0,
        delivery_fee = 0, delivery_address = null, notes = null,
        items = [], order_no_scope = 'day', day_start_hour = 5
      } = params;

      const now = nowUtc();
      const businessDate = getBusinessDate(day_start_hour);
      const scope = order_no_scope === 'shift'
        ? `S:${shift_id}`
        : `D:${businessDate}`;

      const createOrder = db.transaction(() => {
        // Assign order number atomically in the same transaction
        const orderNo = counters.nextNo(scope);

        const { lastInsertRowid: orderId } = insertOrderStmt.run({
          shift_id, table_id, customer_id, driver_id, created_by,
          order_type, order_scope: scope, order_no: orderNo,
          service_bp, tax_bp, tax_inclusive: tax_inclusive ? 1 : 0,
          delivery_fee, delivery_address, notes, business_date: businessDate,
          created_at: now, updated_at: now
        });

        // Insert items
        for (const item of items) {
          const lineTotal = item.unit_price * item.qty;
          const { lastInsertRowid: itemId } = insertItemStmt.run({
            order_id: orderId,
            item_id: item.item_id ?? null,
            size_id: item.size_id ?? null,
            name_ar: item.name_ar,
            size_name_ar: item.size_name_ar ?? null,
            unit_price: item.unit_price,
            base_price: item.base_price,
            modifiers_total: item.modifiers_total ?? 0,
            qty: item.qty,
            line_total: lineTotal,
            service_exempt: item.service_exempt ? 1 : 0,
            tax_exempt: item.tax_exempt ? 1 : 0,
            prep_station: item.prep_station ?? 'kitchen',
            notes: item.notes ?? null,
            created_at: now, updated_at: now
          });

          // Insert modifiers
          for (const mod of (item.modifiers ?? [])) {
            insertModStmt.run(
              itemId, mod.option_id ?? null,
              mod.group_name_ar, mod.option_name_ar,
              mod.price_delta ?? 0, mod.qty ?? 1
            );
          }
        }

        return findByIdStmt.get(orderId);
      });

      return createOrder();
    },

    updateTotals(id, { subtotal, service_amount, tax_amount, discount_total,
                       delivery_fee, rounding, total }) {
      updateTotalsStmt.run(
        subtotal, service_amount, tax_amount,
        discount_total, delivery_fee, rounding, total,
        nowUtc(), id
      );
    },

    cancel(id, { cancel_reason }) {
      updateStatusStmt.run('cancelled', cancel_reason, nowUtc(), id);
      return this.findById(id);
    },

    complete(id) {
      updateStatusStmt.run('completed', null, nowUtc(), id);
      return this.findById(id);
    },

    countByShift(shiftId) {
      return db.prepare('SELECT COUNT(*) as n FROM orders WHERE shift_id = ? AND status != ?')
        .get(shiftId, 'cancelled').n;
    }
  };
}

