// scripts/ensure-native.mjs
// ESM — runs in Node (not Electron).
// Verifies better-sqlite3 works under the Electron ABI.
// Called by:
//   - npm postinstall        → auto-rebuild on failure, always exits 0
//   - npm run check:native   → --check-only flag, exits 1 on failure
//
// Strategy:
//   1. Find the Electron binary in node_modules/.bin/electron (or .cmd on Windows)
//   2. Run check-sqlite.cjs inside Electron with ELECTRON_RUN_AS_NODE=1
//   3. If it passes → done
//   4. If it fails → run @electron/rebuild then re-check
//   5. In --check-only mode: never rebuild, just report and exit 1 on failure

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const checkScript = resolve(__dirname, 'check-sqlite.cjs');
const checkOnly = process.argv.includes('--check-only');

function findElectron() {
  // On Windows the bin shim is .cmd; actual binary is in node_modules/electron/dist/
  const distExe = resolve(root, 'node_modules', 'electron', 'dist', 'electron.exe');
  if (existsSync(distExe)) return distExe;
  // Fallback for non-Windows
  const unix = resolve(root, 'node_modules', '.bin', 'electron');
  if (existsSync(unix)) return unix;
  return null;
}

function runCheck(electronPath) {
  const result = spawnSync(
    electronPath,
    [checkScript],
    {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      cwd: root,
      encoding: 'utf8'
    }
  );
  if (result.error) return { ok: false, error: result.error.message };
  try {
    return JSON.parse(result.stdout.trim().split('\n').at(-1));
  } catch {
    return { ok: false, error: result.stderr || 'No JSON output' };
  }
}

function runRebuild() {
  console.log('[ensure-native] Rebuilding better-sqlite3 for Electron ABI...');
  const result = spawnSync(
    'node',
    [
      resolve(root, 'node_modules', '@electron', 'rebuild', 'lib', 'cli.js'),
      '-f', '-w', 'better-sqlite3'
    ],
    { cwd: root, stdio: 'inherit', encoding: 'utf8' }
  );
  return result.status === 0;
}

const electronPath = findElectron();
if (!electronPath) {
  console.error('[ensure-native] ERROR: Electron binary not found — run npm install first.');
  process.exit(checkOnly ? 1 : 0);
}

console.log('[ensure-native] Checking better-sqlite3 under Electron ABI...');
let result = runCheck(electronPath);

if (result.ok) {
  console.log('[ensure-native] native OK — better-sqlite3 works without rebuild.');
  process.exit(0);
}

console.warn('[ensure-native] Check failed:', result.error);

if (checkOnly) {
  console.error('[ensure-native] FAIL (--check-only, no rebuild attempted).');
  process.exit(1);
}

// postinstall mode: attempt rebuild
const rebuilt = runRebuild();
if (!rebuilt) {
  console.warn('[ensure-native] Rebuild failed — you may need Visual Studio Build Tools.');
  process.exit(0); // postinstall always exits 0 to not block npm install
}

result = runCheck(electronPath);
if (result.ok) {
  console.log('[ensure-native] native OK after rebuild.');
} else {
  console.warn('[ensure-native] Still failing after rebuild:', result.error);
  console.warn('[ensure-native] Install Visual Studio Build Tools (Desktop development with C++) and run: npm run rebuild');
}
process.exit(0); // postinstall always exits 0

