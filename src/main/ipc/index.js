// src/main/ipc/index.js
// Auto-discovers and registers all IPC handler modules in this directory.
// Convention: each *.js file (except index.js and _prefixed files) must export:
//   - domain: string
//   - register({ handle, defineEvents, emit }): void

import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  handle,
  defineEvents,
  emit,
  registerChannelListHandler
} from '../services/ipc.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function registerAllIpc() {
  const files = readdirSync(__dirname)
    .filter(f => f.endsWith('.js') && f !== 'index.js' && !f.startsWith('_'))
    .sort();

  for (const file of files) {
    const mod = await import(`file://${join(__dirname, file)}`);
    if (typeof mod.register !== 'function') {
      throw new Error(`IPC module "${file}" must export a register() function`);
    }
    if (typeof mod.domain !== 'string') {
      throw new Error(`IPC module "${file}" must export a domain string`);
    }
    mod.register({ handle, defineEvents, emit });
  }

  // Must be called AFTER all handlers and events are registered
  registerChannelListHandler();
}
