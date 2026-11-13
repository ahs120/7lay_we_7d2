// src/main/db/paths.js
// Resolves DB file path without using app.getPath() so it works in
// ELECTRON_RUN_AS_NODE mode (scripts & tests) as well as normal Electron.
//
// Priority:
//   1. POS_DB_PATH environment variable (scripts, CI, tests)
//   2. %APPDATA%\<APP_DIR_NAME>[-dev]\data\pos.db  (Windows default)
//
// NOTE: Never import this from renderer. Main-process only.

import { resolve, join } from 'node:path';
import { APP_DIR_NAME } from '../../shared/constants.js';

const isDev = process.argv.includes('--dev')
  || process.env.NODE_ENV === 'development'
  || (!process.env.POS_DB_PATH && process.argv.includes('--selftest') === false
      && !process.env.PACKAGED);

/**
 * Returns the absolute path to the SQLite database file.
 * Uses POS_DB_PATH env var if set (for scripts/tests).
 */
export function getDbPath() {
  if (process.env.POS_DB_PATH) {
    return process.env.POS_DB_PATH;
  }

  // Resolve %APPDATA% (Windows) or $HOME/.config (Linux/Mac for dev)
  const appData = process.env.APPDATA
    ?? join(process.env.HOME ?? process.env.USERPROFILE ?? '.', '.config');

  const dirName = isDev ? `${APP_DIR_NAME}-dev` : APP_DIR_NAME;
  return resolve(appData, dirName, 'data', 'pos.db');
}

/**
 * Returns the userData dir (parent of data/).
 */
export function getUserDataDir() {
  const dbPath = getDbPath();
  // dbPath = .../MohamedFawzyPOS[-dev]/data/pos.db  → go up two levels
  return resolve(dbPath, '..', '..');
}

/**
 * Returns the backups directory path.
 */
export function getBackupsDir() {
  return join(getUserDataDir(), 'backups');
}

/**
 * Returns the restore-pending marker file path.
 */
export function getRestoreMarkerPath() {
  return join(getUserDataDir(), 'restore.pending');
}

