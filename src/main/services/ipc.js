// src/main/services/ipc.js
// Central IPC service. All handlers go through here — never use ipcMain directly.
//
// Usage:
//   handle('domain:action', { schema?, permission?, handler })
//   defineEvents('domain', ['eventName', ...])
//   emit('domain:event', payload)
//   setAuthProvider({ getUser, can })
//   registerChannelListHandler()   ← call after all handlers are registered
//   listInvokeChannels()
//   listEventChannels()

import electron from 'electron';
import { CHANNEL_REGEX, ERROR_CODES } from '../../shared/constants.js';
import { AppError, toErrorPayload } from './errors.js';
import { validate } from './validate.js';
import { log } from './logger.js';

const { ipcMain } = electron;

/** @type {Map<string, { schema?, permission? }>} */
const invokeRegistry = new Map();

/** @type {Set<string>} */
const eventRegistry = new Set();

/** Auth provider — set by setAuthProvider() in main.js after DB ready */
let authProvider = {
  getUser: () => null,
  can: () => true
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Register an IPC invoke handler (renderer calls window.api.invoke(channel, payload)).
 *
 * @param {string} channel  - Must match CHANNEL_REGEX
 * @param {{ schema?: Function, permission?: string, handler: Function }} opts
 *   schema:     optional v.* validator; called with raw payload
 *   permission: optional permission key checked via authProvider.can()
 *   handler:    async (payload, context) => result
 *               context = { user, sender }; result wrapped in { ok: true, data: result }
 */
export function handle(channel, { schema, permission, handler }) {
  if (!CHANNEL_REGEX.test(channel)) {
    throw new Error(`Invalid IPC channel name: "${channel}"`);
  }
  if (invokeRegistry.has(channel)) {
    throw new Error(`Duplicate IPC handler for channel: "${channel}"`);
  }

  invokeRegistry.set(channel, { schema, permission });

  ipcMain.handle(channel, async (event, rawPayload) => {
    try {
      // 1. Parse and validate payload
      const payload = schema ? validate(schema, rawPayload) : rawPayload;

      // 2. Auth check
      const user = authProvider.getUser(event.sender);
      if (permission && !authProvider.can(user, permission)) {
        throw AppError.forbidden();
      }

      // 3. Call handler
      const data = await handler(payload, { user, sender: event.sender });
      return { ok: true, data };
    } catch (err) {
      log.error(`IPC error on "${channel}":`, err);
      return toErrorPayload(err);
    }
  });
}

/**
 * Declare event channels for a domain.
 * Renderer subscribes via window.api.on(channel, callback).
 *
 * @param {string}   domain
 * @param {string[]} names  - e.g. ['fullscreenChanged'] → channel 'domain:fullscreenChanged'
 */
export function defineEvents(domain, names) {
  for (const name of names) {
    const channel = `${domain}:${name}`;
    if (!CHANNEL_REGEX.test(channel)) {
      throw new Error(`Invalid event channel name: "${channel}"`);
    }
    eventRegistry.add(channel);
  }
}

/**
 * Emit an event to all renderer windows.
 *
 * @param {string} channel
 * @param {unknown} payload
 */
export function emit(channel, payload) {
  if (!eventRegistry.has(channel)) {
    log.warn(`emit: unknown event channel "${channel}"`);
  }
  const { BrowserWindow } = electron;
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }
}

/**
 * Set the auth provider. Call this in main.js after the DB and session are ready.
 *
 * @param {{ getUser: Function, can: Function }} provider
 *   getUser(sender): returns user object or null
 *   can(user, permission): returns boolean
 */
export function setAuthProvider(provider) {
  authProvider = provider;
}

/** Returns sorted list of registered invoke channels. */
export function listInvokeChannels() {
  return [...invokeRegistry.keys()].sort();
}

/** Returns sorted list of registered event channels. */
export function listEventChannels() {
  return [...eventRegistry].sort();
}

/**
 * Register the synchronous 'ipc:channels' handler.
 * The preload calls ipcRenderer.sendSync('ipc:channels') at startup
 * to build the dynamic whitelist.
 * MUST be called after all handlers and events are registered.
 */
export function registerChannelListHandler() {
  ipcMain.on('ipc:channels', (event) => {
    // Only respond to frames from our own app:// origin
    const url = event.senderFrame?.url ?? '';
    if (!url.startsWith('app://local')) {
      log.warn('ipc:channels request from unexpected origin:', url);
      event.returnValue = { invoke: [], events: [] };
      return;
    }
    event.returnValue = {
      invoke: listInvokeChannels(),
      events: listEventChannels()
    };
  });
}

