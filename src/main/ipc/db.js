// src/main/ipc/db.js
// Database health check IPC handler.

import { getDbHealth } from '../services/database.js';

export const domain = 'db';

/**
 * @param {{ handle: Function }} ipc
 */
export function register({ handle }) {
  handle('db:health', {
    handler: async () => {
      return getDbHealth();
    }
  });
}
