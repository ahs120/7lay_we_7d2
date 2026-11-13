// src/main/db/repositories/_base.js
// Base repository helpers shared by all repos.

/**
 * Returns current UTC ISO timestamp string.
 * @returns {string}
 */
export function nowUtc() {
  return new Date().toISOString();
}

/**
 * Converts a row value to boolean (SQLite stores as 0/1).
 * @param {number|null|undefined} val
 * @returns {boolean}
 */
export function toBool(val) {
  return val === 1;
}

/**
 * Converts rows in an array: applies field transforms.
 * @param {object[]} rows
 * @param {string[]} boolFields
 * @returns {object[]}
 */
export function transformRows(rows, boolFields = []) {
  return rows.map(r => transformRow(r, boolFields));
}

/**
 * Applies bool transforms to a single row.
 */
export function transformRow(row, boolFields = []) {
  if (!row) return row;
  const result = { ...row };
  for (const f of boolFields) {
    if (f in result) result[f] = toBool(result[f]);
  }
  return result;
}

/**
 * Build a SET clause and values array for an UPDATE statement.
 * Only includes fields present in `data`.
 *
 * @param {object} data
 * @param {string[]} allowedFields
 * @param {boolean} [addUpdatedAt=true]
 * @returns {{ setClause: string, values: unknown[] }}
 */
export function buildUpdateSet(data, allowedFields, addUpdatedAt = true) {
  const fields = [];
  const values = [];
  for (const field of allowedFields) {
    if (field in data) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
    }
  }
  if (addUpdatedAt) {
    fields.push('updated_at = ?');
    values.push(nowUtc());
  }
  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }
  return { setClause: fields.join(', '), values };
}

