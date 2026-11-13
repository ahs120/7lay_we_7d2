// src/main/ipc/backup.js
// Backup & restore IPC handlers.
// NOTE: In Part 3, restore will require high-level owner permissions.

import electron from 'electron';
import { v } from '../services/validate.js';
import { createBackup, listBackups, stageRestore } from '../services/backup.js';
import { getDb, getRepos } from '../services/database.js';
import { log } from '../services/logger.js';

const { app, dialog } = electron;

export const domain = 'backup';

/**
 * @param {{ handle: Function }} ipc
 */
export function register({ handle }) {
  // ── backup:run ──────────────────────────────────────────────────────────
  handle('backup:run', {
    schema: v.object({
      type: v.oneOf(['manual', 'auto'], { optional: true })
    }, { optional: true }),
    handler: async (payload) => {
      const db = getDb();
      const repos = getRepos();
      const customDir = repos.settings.get('backup.dir') || null;
      const type = payload?.type || 'manual';

      const result = await createBackup(db, {
        type,
        destDir: customDir
      });

      return result;
    }
  });

  // ── backup:list ─────────────────────────────────────────────────────────
  handle('backup:list', {
    handler: async () => {
      const repos = getRepos();
      const customDir = repos.settings.get('backup.dir') || null;
      return listBackups(customDir);
    }
  });

  // ── backup:chooseDir ────────────────────────────────────────────────────
  handle('backup:chooseDir', {
    handler: async () => {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'اختر مجلد النسخ الاحتياطية',
        properties: ['openDirectory', 'createDirectory']
      });

      if (canceled || filePaths.length === 0) {
        return { canceled: true };
      }

      const chosenPath = filePaths[0];
      const repos = getRepos();
      repos.settings.set('backup.dir', chosenPath);

      log.info(`Updated backup.dir setting to: ${chosenPath}`);
      return { canceled: false, path: chosenPath };
    }
  });

  // ── backup:restore ──────────────────────────────────────────────────────
  handle('backup:restore', {
    schema: v.object({
      path: v.string({ min: 1, max: 2000 })
    }),
    handler: async ({ path }) => {
      const db = getDb();
      log.warn(`Staging restore from file: ${path}`);

      await stageRestore(db, path);

      // Schedule relaunch and exit to trigger swap-at-boot
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 500);

      return { scheduled: true };
    }
  });
}
