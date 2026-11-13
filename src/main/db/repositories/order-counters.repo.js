// src/main/db/repositories/order-counters.repo.js
// Atomic order number assignment.
// Uses RETURNING clause (SQLite 3.35+, our version 3.54 supports it).

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createOrderCountersRepo(db) {
  // Upsert + increment in a single statement using RETURNING
  const incrementStmt = db.prepare(`
    INSERT INTO order_counters(scope, last_no) VALUES(?, 1)
    ON CONFLICT(scope) DO UPDATE SET last_no = last_no + 1
    RETURNING last_no
  `);

  const getStmt = db.prepare('SELECT last_no FROM order_counters WHERE scope = ?');
  const resetStmt = db.prepare('DELETE FROM order_counters WHERE scope = ?');
  const allStmt = db.prepare('SELECT scope, last_no FROM order_counters ORDER BY scope');

  return {
    /**
     * Atomically increment and return the next order number for a scope.
     * MUST be called inside the same transaction as order INSERT.
     *
     * @param {string} scope - 'D:YYYY-MM-DD' or 'S:<shift_id>'
     * @returns {number}
     */
    nextNo(scope) {
      const row = incrementStmt.get(scope);
      return row.last_no;
    },

    /** Returns current last_no for a scope (read-only). */
    getCurrent(scope) {
      return getStmt.get(scope)?.last_no ?? 0;
    },

    /** Reset a scope (for testing only). */
    reset(scope) {
      resetStmt.run(scope);
    },

    /** All counters (for diagnostics). */
    all() {
      return allStmt.all();
    }
  };
}

