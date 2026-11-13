// src/main/services/window.js
// Creates and manages the main application window.

import electron from 'electron';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_NAME_AR } from '../../shared/constants.js';
import { isDev, isPackaged } from './runtime.js';
import { emit } from '../services/ipc.js';
import { log } from './logger.js';

const { BrowserWindow } = electron;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Preload is CommonJS (sandbox requirement), lives at src/preload/preload.js
const PRELOAD_PATH = resolve(__dirname, '..', '..', 'preload', 'preload.js');

/** @type {BrowserWindow | null} */
let mainWindow = null;

/** Returns the main window (or null if not created yet / destroyed). */
export function getMainWindow() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

/** Creates and shows the main application window. */
export function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: `${APP_NAME_AR} — حدّق وحلّي`,
    backgroundColor: '#F2E3CA',
    show: false, // avoid white flash; shown on ready-to-show
    webPreferences: {
      preload: PRELOAD_PATH,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !isPackaged()
    }
  });

  // Show only when fully painted
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // Fullscreen events → IPC event
  mainWindow.on('enter-full-screen', () => {
    emit('app:fullscreenChanged', { fullscreen: true });
  });
  mainWindow.on('leave-full-screen', () => {
    emit('app:fullscreenChanged', { fullscreen: false });
  });

  // F11 toggles fullscreen
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
    // Block F12 / DevTools in packaged build
    if (isPackaged() && input.type === 'keyDown' && input.key === 'F12') {
      // swallow — do nothing
    }
  });

  // Forward renderer console warnings/errors to the main log
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) { // 2=warning, 3=error
      log.warn(`[renderer] ${message}`, { line, source: sourceId });
    }
  });

  // Reload once on render-process crash, then log
  let reloaded = false;
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log.error('Render process gone:', details);
    if (!reloaded) {
      reloaded = true;
      log.info('Attempting to reload after render-process-gone...');
      mainWindow.reload();
    }
  });

  return mainWindow;
}
