// scripts/db-migrate.mjs
// Runs pending database migrations.

import { getDbPath } from '../src/main/db/paths.js';
import { openDb, closeDb } from '../src/main/db/connection.js';
import { runMigrations, getSchemaVersion, getLatestVersion } from '../src/main/db/migrate.js';

const dbPath = getDbPath();
console.log(`[db:migrate] Checking migrations for: ${dbPath}`);

const db = openDb(dbPath);
try {
  const beforeVer = getSchemaVersion(db);
  const result = await runMigrations(db);
  const afterVer = getSchemaVersion(db);
  const latest = getLatestVersion();

  console.log(
    `[db:migrate] Applied: ${result.applied}, Skipped: ${result.skipped}. ` +
    `Schema version: ${beforeVer} -> ${afterVer} (Latest available: ${latest})`
  );
} finally {
  closeDb(db);
}
process.exit(0);
