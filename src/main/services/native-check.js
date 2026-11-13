// src/main/services/native-check.js
// Verifies that better-sqlite3 opens an in-memory database.
// Uses only db.open and db.memory properties — NO SQL statements.
// SQL belongs exclusively in src/main/db/repositories/.

/** @returns {Promise<{ ok: true } | { ok: false, error: string }>} */
export async function checkSqlite() {
  let db;
  try {
    // Lazy import — avoids loading the native module at startup
    const { default: Database } = await import('better-sqlite3');
    db = new Database(':memory:');

    if (!db.open) throw new Error('Database did not open');
    if (!db.memory) throw new Error('Expected in-memory database');

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    try { db?.close(); } catch { /* ignore */ }
  }
}

