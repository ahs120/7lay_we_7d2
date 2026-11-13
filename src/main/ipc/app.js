// src/main/ipc/app.js
// IPC handlers for the 'app' domain.

import electron from 'electron';
import { v } from '../services/validate.js';
import { checkSqlite } from '../services/native-check.js';
import { getLogFilePath } from '../services/logger.js';
import { isDev } from '../services/runtime.js';

const { app } = electron;

export const domain = 'app';

/**
 * @param {{ handle: Function, defineEvents: Function, emit: Function }} ipc
 */
export function register({ handle, defineEvents, emit }) {
  // ── app:ping ──────────────────────────────────────────────────────────────
  handle('app:ping', {
    schema: v.object(
      { message: v.string({ max: 200, optional: true }) },
      { optional: true }
    ),
    handler: async (payload) => ({
      pong: true,
      message: payload?.message ?? null,
      ts: Date.now()
    })
  });

  // ── app:info ──────────────────────────────────────────────────────────────
  handle('app:info', {
    handler: async () => {
      const sqliteResult = await checkSqlite();
      return {
        version: app.getVersion(),
        electron: process.versions.electron,
        node: process.versions.node,
        platform: process.platform,
        arch: process.arch,
        locale: app.getLocale(),
        userData: app.getPath('userData'),
        logFile: getLogFilePath(),
        sqlite: sqliteResult,
        dev: isDev
      };
    }
  });

  // ── Events ────────────────────────────────────────────────────────────────
  defineEvents(domain, ['fullscreenChanged']);

  // expose emit so window.js can call it
  return { emit };
}
