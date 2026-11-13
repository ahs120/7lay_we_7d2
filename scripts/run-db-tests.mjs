// scripts/run-db-tests.mjs
// Discovers and runs all tests in tests/db/*.test.mjs using node:test.
// Runs inside Electron (ELECTRON_RUN_AS_NODE=1) via scripts/run-electron-node.mjs.

import { readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testsDir = resolve(__dirname, '..', 'tests', 'db');

const files = readdirSync(testsDir)
  .filter(f => f.endsWith('.test.mjs') || f.endsWith('.test.js'))
  .sort()
  .map(f => join(testsDir, f));

if (files.length === 0) {
  console.log('[test:db] No test files found in tests/db/');
  process.exit(0);
}

console.log(`[test:db] Running ${files.length} test file(s) in Electron node mode...`);

run({ files, concurrency: false })
  .compose(new spec())
  .pipe(process.stdout);
