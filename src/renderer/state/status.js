// src/renderer/state/status.js
// Status store tracking shift state and receipt printer health.

import { createStore } from '../utils/store.js';

export const statusStore = createStore({
  shift: {
    open: true,
    openedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago for UI preview
    shiftId: 1
  },
  printer: {
    status: 'ok', // 'ok' | 'error' | 'offline'
    name: 'Receipt Printer'
  }
});

/**
 * Update shift status.
 * @param {object} shift
 */
export function setShift(shift) {
  statusStore.set({ shift });
}

/**
 * Update printer status.
 * @param {object} printer
 */
export function setPrinter(printer) {
  statusStore.set({ printer });
}
