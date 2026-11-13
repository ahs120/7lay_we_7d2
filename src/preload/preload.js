// src/preload/preload.js
// CommonJS — required by Electron sandbox (sandbox: true disallows ESM preloads).
// Exposes window.api to the renderer via contextBridge.
//
// window.api.invoke(channel, payload) → Promise<{ ok, data } | { ok:false, code, message }>
// window.api.on(channel, callback)    → unsubscribe function
//
// Security:
//   - Fetches allowed channels from main via ipc:channels (sendSync) at startup.
//   - Only channels matching CHANNEL_REGEX and in the whitelist are allowed.
//   - CHANNEL_REGEX is duplicated here (can't import shared in sandbox mode).
//     Keep in sync with src/shared/constants.js → CHANNEL_REGEX.

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Duplicate of CHANNEL_REGEX from src/shared/constants.js
// KEEP IN SYNC with that file.
const CHANNEL_REGEX = /^[a-z][a-z0-9]*:[a-zA-Z][a-zA-Z0-9]*$/;

// Fetch channel whitelist from main synchronously at preload time.
// If the main process hasn't registered handlers yet this returns empty lists —
// but registerChannelListHandler() is called after registerAllIpc() so it's safe.
let invokeChannels = new Set();
let eventChannels = new Set();

try {
  const lists = ipcRenderer.sendSync('ipc:channels');
  if (lists && Array.isArray(lists.invoke)) {
    invokeChannels = new Set(lists.invoke);
  }
  if (lists && Array.isArray(lists.events)) {
    eventChannels = new Set(lists.events);
  }
} catch (err) {
  // If this fails, all invoke/on calls will return UNKNOWN_CHANNEL errors.
  console.error('[preload] Failed to fetch channel whitelist:', err);
}

// ── API surface ──────────────────────────────────────────────────────────────

/**
 * Invoke an IPC channel. Never rejects — always resolves with { ok, ... }.
 *
 * @param {string}  channel
 * @param {unknown} [payload]
 * @returns {Promise<{ ok: true, data: unknown } | { ok: false, code: string, message: string }>}
 */
function invoke(channel, payload) {
  if (typeof channel !== 'string' || !CHANNEL_REGEX.test(channel)) {
    return Promise.resolve({ ok: false, code: 'BAD_CHANNEL', message: 'Invalid channel name' });
  }
  if (!invokeChannels.has(channel)) {
    return Promise.resolve({ ok: false, code: 'UNKNOWN_CHANNEL', message: `Unknown channel: ${channel}` });
  }
  return ipcRenderer.invoke(channel, payload).catch((err) => ({
    ok: false,
    code: 'INTERNAL',
    message: err?.message ?? 'IPC error'
  }));
}

/**
 * Subscribe to a push event from main.
 * Throws TypeError if channel is not in the event whitelist.
 *
 * @param {string}   channel
 * @param {Function} callback  - Called with the event payload
 * @returns {Function}         - Call to unsubscribe
 */
function on(channel, callback) {
  if (typeof channel !== 'string' || !CHANNEL_REGEX.test(channel)) {
    throw new TypeError(`[api.on] Invalid channel name: "${channel}"`);
  }
  if (!eventChannels.has(channel)) {
    throw new TypeError(`[api.on] Unknown event channel: "${channel}"`);
  }
  if (typeof callback !== 'function') {
    throw new TypeError('[api.on] callback must be a function');
  }

  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);

  return function unsubscribe() {
    ipcRenderer.removeListener(channel, listener);
  };
}

// ── Expose to renderer ───────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('api', Object.freeze({ invoke, on }));
