// src/main/services/logger.js
// Wraps electron-log. Call initLogger() once after userData path is set.
// Exports: log (electron-log instance), getLogFilePath()

import log from 'electron-log/main.js';
import { join } from 'node:path';
import electron from 'electron';

const { app } = electron;

let initialized = false;

/**
 * Initialize the logger. Must be called after app.setPath('userData', ...) and
 * after the app 'ready' event (so app.getPath works).
 *
 * @param {{ dev?: boolean }} [opts]
 */
export function initLogger({ dev = false } = {}) {
  if (initialized) return log;
  initialized = true;

  // electron-log must be initialized before first use
  log.initialize();

  // File transport: rotate at 5 MB, keep up to 3 old files
  log.transports.file.maxSize = 5 * 1024 * 1024;
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
  log.transports.file.archiveLogFn = (file) => {
    // Keep one rotated backup alongside the main log
    return file.toString() + '.old';
  };

  // Console transport: verbose in dev, errors-only in production
  log.transports.console.level = dev ? 'debug' : 'warn';
  log.transports.file.level = dev ? 'debug' : 'info';

  log.info('Logger initialized', { dev, version: app.getVersion() });
  return log;
}

/**
 * Returns the absolute path to the current log file.
 * Only valid after initLogger() has been called.
 */
export function getLogFilePath() {
  return log.transports.file.getFile()?.path ?? join(app.getPath('userData'), 'logs', 'main.log');
}

export { log };
