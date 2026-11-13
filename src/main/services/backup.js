// src/main/services/backup.js
// Database backup and restore service.
//
// Rules:
//   - Backups use async db.backup(dest) for consistent WAL snapshots.
//   - Backups are verified with openReadonlyDb + PRAGMA integrity_check immediately.
//   - File naming: MohamedFawzyPOS-YYYYMMDD-HHmmss-{type}.db
//   - Auto-backups are pruned to keep the last N files (default 10).
//   - Restore uses "swap-at-boot" pattern to handle Windows file locking:
//       1. Inspect target backup (readonly integrity + schema version)
//       2. Take a prerestore backup of current DB
//       3. Write restore.pending marker file with target path
//       4. app.relaunch() + app.exit(0)
//       5. Next boot detects marker before openDb(), copies file, deletes marker

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { openReadonlyDb, integrityCheck } from '../db/connection.js';
import { getBackupsDir, getDbPath, getRestoreMarkerPath } from '../db/paths.js';
import { getLatestVersion, getSchemaVersion } from '../db/migrate.js';
import { log } from './logger.js';

/**
 * Format timestamp into YYYYMMDD-HHmmss.
 */
function formatTimestamp(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}${m}${day}-${h}${min}${s}`;
}

/**
 * Perform a database backup.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {object} [opts]
 * @param {'manual'|'auto'|'premigrate'|'prerestore'} [opts.type='manual']
 * @param {string} [opts.destDir]
 * @param {number} [opts.keepAuto=10]
 * @returns {Promise<{ ok: boolean, path: string, filename: string, size: number, type: string }>}
 */
export async function createBackup(db, { type = 'manual', destDir = null, keepAuto = 10 } = {}) {
  const dir = destDir ? resolve(destDir) : getBackupsDir();
  mkdirSync(dir, { recursive: true });

  const stamp = formatTimestamp();
  let filename = `MohamedFawzyPOS-${stamp}-${type}.db`;
  let destPath = join(dir, filename);
  let counter = 1;
  while (existsSync(destPath)) {
    filename = `MohamedFawzyPOS-${stamp}_${counter}-${type}.db`;
    destPath = join(dir, filename);
    counter++;
  }

  log.info(`Creating ${type} backup at: ${destPath}`);

  // SQLite online backup API
  await db.backup(destPath);

  // Verification step: verify backup file integrity via read-only connection
  let roDb;
  try {
    roDb = openReadonlyDb(destPath);
    const check = integrityCheck(roDb);
    if (!check.ok) {
      throw new Error(`Backup integrity check failed: ${check.errors.join(', ')}`);
    }
  } finally {
    try { roDb?.close(); } catch { /* ignore */ }
  }

  const stat = statSync(destPath);

  // Prune old auto-backups if this was an auto backup
  if (type === 'auto') {
    pruneAutoBackups(dir, keepAuto);
  }

  log.info(`Backup completed successfully (${stat.size} bytes)`);
  return {
    ok: true,
    path: destPath,
    filename,
    size: stat.size,
    type
  };
}

/**
 * List all available backups in directory.
 *
 * @param {string} [dir]
 * @returns {Array<{ filename: string, path: string, size: number, type: string, createdAt: string }>}
 */
export function listBackups(dir = null) {
  const targetDir = dir ? resolve(dir) : getBackupsDir();
  if (!existsSync(targetDir)) return [];

  const files = readdirSync(targetDir)
    .filter(f => /^MohamedFawzyPOS-\d{8}-\d{6}(?:_\d+)?-(manual|auto|premigrate|prerestore)\.db$/.test(f))
    .sort()
    .reverse();

  return files.map(file => {
    const fullPath = join(targetDir, file);
    const stat = statSync(fullPath);
    const match = file.match(/-(manual|auto|premigrate|prerestore)\.db$/);
    const type = match ? match[1] : 'unknown';
    return {
      filename: file,
      path: fullPath,
      size: stat.size,
      type,
      createdAt: stat.mtime.toISOString()
    };
  });
}

/**
 * Prune old auto backups keeping only the most recent N files.
 */
export function pruneAutoBackups(dir, keepCount = 10) {
  try {
    const autoFiles = listBackups(dir)
      .filter(b => b.type === 'auto');

    if (autoFiles.length > keepCount) {
      const toDelete = autoFiles.slice(keepCount);
      for (const item of toDelete) {
        log.info(`Pruning old auto backup: ${item.filename}`);
        unlinkSync(item.path);
      }
    }
  } catch (err) {
    log.warn('Failed to prune auto backups:', err);
  }
}

/**
 * Stage a restore by validating the target file, creating a pre-restore backup,
 * and writing the marker file for swap-at-boot.
 *
 * @param {import('better-sqlite3').Database} currentDb
 * @param {string} backupFilePath
 * @param {object} [opts]
 * @param {string} [opts.destDir]
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function stageRestore(currentDb, backupFilePath, { destDir = null } = {}) {
  if (!existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }

  // 1. Validate target file integrity and schema
  let roDb;
  try {
    roDb = openReadonlyDb(backupFilePath);
    const check = integrityCheck(roDb);
    if (!check.ok) {
      throw new Error(`Backup file is corrupted: ${check.errors.join(', ')}`);
    }

    const backupSchemaVer = getSchemaVersion(roDb);
    const appMaxVer = getLatestVersion();
    if (backupSchemaVer > appMaxVer) {
      throw new Error(
        `Backup schema version (${backupSchemaVer}) is newer than application (${appMaxVer}). Cannot restore.`
      );
    }
  } finally {
    try { roDb?.close(); } catch { /* ignore */ }
  }

  // 2. Take prerestore backup of current DB
  if (currentDb && currentDb.open) {
    await createBackup(currentDb, { type: 'prerestore', destDir: destDir || dirname(backupFilePath) });
  }

  // 3. Write restore.pending marker file
  const markerPath = getRestoreMarkerPath();
  mkdirSync(dirname(markerPath), { recursive: true });
  writeFileSync(markerPath, JSON.stringify({
    sourcePath: resolve(backupFilePath),
    stagedAt: new Date().toISOString()
  }), 'utf8');

  log.info(`Restore staged with marker at: ${markerPath}`);
  return { ok: true };
}

/**
 * Execute pending swap-at-boot restore before opening database.
 * Called synchronously in early boot sequence.
 */
export function applyPendingRestoreIfExists() {
  const markerPath = getRestoreMarkerPath();
  if (!existsSync(markerPath)) return { applied: false };

  log.info(`Found restore marker at: ${markerPath}`);
  let data;
  try {
    data = JSON.parse(readFileSync(markerPath, 'utf8'));
  } catch (err) {
    log.error('Invalid restore marker, removing:', err);
    unlinkSync(markerPath);
    return { applied: false, error: err.message };
  }

  const { sourcePath } = data;
  const dbPath = getDbPath();

  try {
    if (!existsSync(sourcePath)) {
      throw new Error(`Source backup not found: ${sourcePath}`);
    }

    // Remove WAL and SHM files of existing DB if present
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    if (existsSync(walPath)) unlinkSync(walPath);
    if (existsSync(shmPath)) unlinkSync(shmPath);

    // Overwrite DB file
    mkdirSync(dirname(dbPath), { recursive: true });
    copyFileSync(sourcePath, dbPath);

    // Clean marker
    unlinkSync(markerPath);
    log.info(`Database restored successfully from: ${sourcePath}`);
    return { applied: true, sourcePath };
  } catch (err) {
    log.error('Failed to apply pending restore:', err);
    try { unlinkSync(markerPath); } catch { /* ignore */ }
    throw err;
  }
}
