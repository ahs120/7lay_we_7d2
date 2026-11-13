// src/main/main.js
// Application entry point.
// Boot order:
//   1. app.setName, app.setPath (userData), app.setAppUserModelId, app.enableSandbox()
//   2. registerAppScheme() — MUST be before app ready
//   3. Single-instance lock (skipped for --selftest)
//   4. Global security hardening (web-contents-created)
//   5. Uncaught error handlers
//   6. app.whenReady: initLogger, Menu.setApplicationMenu(null),
//      session permissions, registerAppProtocol, initDatabase, registerAllIpc, createMainWindow
//   7. --selftest: run checks on temporary db, write report to userData/logs/selftest.json, then exit
//   8. before-quit: perform auto-backup on graceful exit

import electron from 'electron';
import { join, resolve } from 'node:path';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { APP_NAME_AR, APP_DIR_NAME, APP_ID } from '../shared/constants.js';
import { isDev, isSelfTest } from './services/runtime.js';
import { registerAppScheme, registerAppProtocol } from './services/protocol.js';
import { initLogger, log } from './services/logger.js';
import { createMainWindow, getMainWindow } from './services/window.js';
import { registerAllIpc } from './ipc/index.js';
import { checkSqlite } from './services/native-check.js';
import { initDatabase, closeDatabase, getDbHealth, getDb } from './services/database.js';
import { createBackup } from './services/backup.js';

const { app, Menu, session } = electron;

// ── 1. Early app configuration ─────────────────────────────────────────────

app.setName(APP_NAME_AR);

// userData: use a -dev suffix in development to keep test data separate
const userDataDir = isDev
  ? resolve(app.getPath('appData'), `${APP_DIR_NAME}-dev`)
  : resolve(app.getPath('appData'), APP_DIR_NAME);

app.setPath('userData', userDataDir);
app.setAppUserModelId(APP_ID);

// Sandbox all renderer processes
app.enableSandbox();

// ── 2. Register custom protocol BEFORE ready ───────────────────────────────

registerAppScheme();

// ── 3. Global security hardening ───────────────────────────────────────────

// Deny all permission requests (microphone, camera, notifications, etc.)
app.on('web-contents-created', (_event, contents) => {
  // Block navigation to external URLs
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://local')) {
      event.preventDefault();
      log.warn('Blocked navigation to:', url);
    }
  });

  // Block new windows / popups
  contents.setWindowOpenHandler(({ url }) => {
    log.warn('Blocked window.open to:', url);
    return { action: 'deny' };
  });
});

// ── 4. Uncaught error handlers ─────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  try { log.error('Uncaught exception:', err); } catch { console.error(err); }
});

process.on('unhandledRejection', (reason) => {
  try { log.error('Unhandled rejection:', reason); } catch { console.error(reason); }
});

// ── 5. Single-instance lock (skip for selftest) ────────────────────────────

if (!isSelfTest) {
  const hasLock = app.requestSingleInstanceLock();
  if (!hasLock) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      const win = getMainWindow();
      if (win) {
        if (win.isMinimized()) win.restore();
        win.focus();
      }
    });
  }
}

// ── 6. Main ready handler ──────────────────────────────────────────────────

app.whenReady().then(async () => {
  // Logger needs userData to exist
  initLogger({ dev: isDev });
  log.info('App ready', { userData: userDataDir, dev: isDev, selftest: isSelfTest });

  // Remove default menu (File/Edit/View/…)
  Menu.setApplicationMenu(null);

  // Deny all permission requests globally
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  // Register app:// file-serving protocol
  registerAppProtocol();

  // ── Selftest mode ──────────────────────────────────────────────────────
  if (isSelfTest) {
    await runSelfTest();
    return;
  }

  // ── Database boot sequence ─────────────────────────────────────────────
  try {
    await initDatabase();
  } catch (err) {
    log.error('Database initialization fatal error:', err);
    // Let window show error in diagnostic page
  }

  // Register all IPC handlers (auto-discovered from src/main/ipc/)
  await registerAllIpc();

  // ── Normal mode: open window ───────────────────────────────────────────
  const win = createMainWindow();
  await win.loadURL('app://local/');
});

// ── 7. Graceful quit & auto-backup ─────────────────────────────────────────

let isQuitting = false;
app.on('before-quit', (event) => {
  if (isQuitting || isSelfTest) return;
  isQuitting = true;
  event.preventDefault();

  const fallbackTimer = setTimeout(() => {
    log.warn('Quit timeout reached; forcing exit');
    closeDatabase();
    app.exit(0);
  }, 10000);

  (async () => {
    try {
      const db = getDb();
      if (db && db.open) {
        log.info('Taking automated backup on exit...');
        await createBackup(db, { type: 'auto' });
      }
    } catch (err) {
      log.warn('Auto backup on quit failed:', err);
    } finally {
      clearTimeout(fallbackTimer);
      closeDatabase();
      app.exit(0);
    }
  })();
});

app.on('window-all-closed', () => {
  app.quit();
});

// ── Selftest implementation ────────────────────────────────────────────────

async function runSelfTest() {
  const results = { ok: true, checks: {} };

  // Check 1: SQLite native module
  try {
    const sqliteResult = await checkSqlite();
    results.checks.sqlite = sqliteResult;
    if (!sqliteResult.ok) results.ok = false;
  } catch (err) {
    results.checks.sqlite = { ok: false, error: err.message };
    results.ok = false;
  }

  // Check 2: userData path accessible
  try {
    const logsDir = join(userDataDir, 'logs');
    await mkdir(logsDir, { recursive: true });
    results.checks.userData = { ok: true, path: userDataDir };
  } catch (err) {
    results.checks.userData = { ok: false, error: err.message };
    results.ok = false;
  }

  // Check 3: app info
  results.checks.versions = {
    ok: true,
    electron: process.versions.electron,
    node: process.versions.node,
    version: app.getVersion()
  };

  // Check 4: Database lifecycle on temp DB
  const tempDbPath = join(userDataDir, 'logs', `selftest-temp-${Date.now()}.db`);
  try {
    const { db, repos } = await initDatabase({ dbPath: tempDbPath });
    const health = getDbHealth();
    const catCount = repos.categories.count();
    const tableCount = repos.tables.count();
    const seeded = Boolean(repos.settings.get('system.seeded_at'));

    results.checks.database = {
      ok: health.ok && catCount === 6 && tableCount === 12 && seeded,
      health,
      counts: { categories: catCount, tables: tableCount },
      seeded
    };
    if (!results.checks.database.ok) results.ok = false;
    closeDatabase();

    // Clean up temporary database files
    for (const ext of ['', '-wal', '-shm']) {
      const p = `${tempDbPath}${ext}`;
      if (existsSync(p)) await unlink(p);
    }
  } catch (err) {
    results.checks.database = { ok: false, error: err.message };
    results.ok = false;
    closeDatabase();
  }

  // Write selftest.json
  const outPath = join(userDataDir, 'logs', 'selftest.json');
  try {
    await mkdir(join(userDataDir, 'logs'), { recursive: true });
    await writeFile(outPath, JSON.stringify(results, null, 2));
    log.info('Selftest complete, results written to:', outPath);
    console.log(JSON.stringify(results));
  } catch (err) {
    log.error('Failed to write selftest.json:', err);
    console.error(JSON.stringify({ ok: false, error: err.message }));
  }

  app.exit(results.ok ? 0 : 1);
}
