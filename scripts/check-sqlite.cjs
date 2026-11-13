// scripts/check-sqlite.cjs
// CommonJS — runs inside Electron with ELECTRON_RUN_AS_NODE=1
// Verifies better-sqlite3 opens an in-memory database without SQL.
// Prints one JSON line to stdout and exits.

'use strict';

try {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');

  // Verify open state via properties only — no SQL statements
  if (!db.open || !db.memory) {
    throw new Error('Database did not open in memory mode');
  }

  db.close();

  const result = {
    ok: true,
    // sqlite version via pragma is not SQL per se, but we keep it clean:
    // read it from the compiled version info on the binding
    electron: process.versions.electron || 'unknown',
    node: process.versions.node
  };
  console.log(JSON.stringify(result));
  process.exit(0);
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: err.message }));
  process.exit(1);
}

