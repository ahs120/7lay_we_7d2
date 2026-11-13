// scripts/run-electron-node.mjs
// Runs a script inside Electron with ELECTRON_RUN_AS_NODE=1.
// Use this wrapper instead of setting ELECTRON_RUN_AS_NODE in the shell
// (setting it in PowerShell persists and breaks `npm start`).
//
// Usage: node scripts/run-electron-node.mjs <scriptPath> [...args]
// npm scripts: "db:reset": "node scripts/run-electron-node.mjs scripts/db-reset.mjs"

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Find Electron binary (Windows first, then Unix fallback)
function findElectron() {
  const win = resolve(root, 'node_modules', 'electron', 'dist', 'electron.exe');
  if (existsSync(win)) return win;
  const unix = resolve(root, 'node_modules', '.bin', 'electron');
  if (existsSync(unix)) return unix;
  throw new Error('Electron binary not found — run npm install first.');
}

const [, , scriptArg, ...rest] = process.argv;
if (!scriptArg) {
  console.error('Usage: node scripts/run-electron-node.mjs <script> [...args]');
  process.exit(1);
}

const scriptPath = resolve(root, scriptArg);
if (!existsSync(scriptPath)) {
  console.error(`Script not found: ${scriptPath}`);
  process.exit(1);
}

const electronPath = findElectron();

const result = spawnSync(
  electronPath,
  [scriptPath, ...rest],
  {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      // Clear any ELECTRON_RUN_AS_NODE that might be set by parent shell
    },
    cwd: root,
    stdio: 'inherit',
    encoding: 'utf8'
  }
);

if (result.error) {
  console.error('Failed to launch Electron:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);

