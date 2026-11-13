// scripts/db-reset.mjs
// Resets the database: deletes db files, re-runs migrations, and seeds demo data.
// Safety: Only works on dev database unless explicitly called with --prod and --yes.

import { existsSync, unlinkSync } from 'node:fs';
import { getDbPath } from '../src/main/db/paths.js';
import { initDatabase, closeDatabase } from '../src/main/services/database.js';

const isProdFlag = process.argv.includes('--prod');
const isYesFlag = process.argv.includes('--yes');
const dbPath = getDbPath();

if (isProdFlag && !isYesFlag) {
  console.error('ERROR: To reset a production database, you must supply both --prod and --yes flags.');
  process.exit(1);
}

if (!isProdFlag && !dbPath.includes('-dev') && !process.env.POS_DB_PATH) {
  console.error(`REFUSED: Target database path does not look like a dev DB:\n  ${dbPath}`);
  console.error('Use --prod --yes if you really intended to reset this database.');
  process.exit(1);
}

console.log(`[db:reset] Resetting database at: ${dbPath}`);

// Delete DB files if they exist
for (const ext of ['', '-wal', '-shm']) {
  const p = `${dbPath}${ext}`;
  if (existsSync(p)) {
    unlinkSync(p);
    console.log(`[db:reset] Removed ${p}`);
  }
}

// Re-initialize (creates DB, runs migrations, seeds data)
const { db, repos } = await initDatabase({ dbPath });
const catCount = repos.categories.count();
const itemCount = repos.items.count();
const tableCount = repos.tables.count();

console.log(`[db:reset] Complete! Categories: ${catCount}, Items: ${itemCount}, Tables: ${tableCount}`);
closeDatabase();
process.exit(0);
