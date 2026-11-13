// scripts/db-seed.mjs
// Seeds the database with demo menu and table data.
// Pass --force to re-seed demo data even if already seeded.

import { getDbPath } from '../src/main/db/paths.js';
import { initDatabase, closeDatabase } from '../src/main/services/database.js';
import { runSeed } from '../src/main/db/seed/index.js';

const force = process.argv.includes('--force');
const { db, repos } = await initDatabase({ skipSeed: true });

console.log(`[db:seed] Seeding database at: ${getDbPath()} (force: ${force})`);
const result = runSeed(db, { force, repos });

console.log(`[db:seed] Result: seeded=${result.seeded}, demo=${result.demo}`);
closeDatabase();
process.exit(0);
