// src/main/services/runtime.js
// Runtime flags derived from process.argv. Import this instead of reading
// process.argv directly — keeps flag logic in one place.
// NOTE: isPackaged() is intentionally synchronous but safe — it reads
//       app.isPackaged which is set by Electron before any JS runs.

import electron from 'electron';

const { app } = electron;

export const isDev = process.argv.includes('--dev');
export const isSelfTest = process.argv.includes('--selftest');

/** Returns true when running from an installed/packaged build. */
export function isPackaged() {
  return app?.isPackaged ?? false;
}

/** Generic argv flag check. */
export function hasFlag(name) {
  return process.argv.includes(name);
}
