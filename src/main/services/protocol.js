// src/main/services/protocol.js
// Registers the app:// custom protocol that serves src/renderer files.
// /shared/* is mapped to src/shared for shared modules accessible from renderer.
//
// Must call registerAppScheme() BEFORE app ready.
// Must call registerAppProtocol() AFTER app ready.

import electron from 'electron';
import { readFile } from 'node:fs/promises';
import { join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_ORIGIN } from '../../shared/constants.js';
import { log } from './logger.js';

const { protocol, app } = electron;

const SCHEME = 'app';

// Content-Type map
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf'
};

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join('; ');

/** Call BEFORE app ready to register scheme as privileged. */
export function registerAppScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: false,
        stream: false
      }
    }
  ]);
}

/** Call AFTER app ready to handle app:// requests. */
export function registerAppProtocol() {
  // Resolve base directories
  // __dirname is not available in ESM — derive from import.meta.url
  // We use app.getAppPath() which works both in dev and packaged (asar-aware)
  const appRoot = app.getAppPath();
  const rendererRoot = resolve(appRoot, 'src', 'renderer');
  const sharedRoot = resolve(appRoot, 'src', 'shared');

  protocol.handle(SCHEME, async (request) => {
    try {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);

      // Strip leading slash
      if (pathname.startsWith('/')) pathname = pathname.slice(1);

      // Route /shared/* → src/shared
      let baseDir;
      if (pathname.startsWith('shared/')) {
        baseDir = sharedRoot;
        pathname = pathname.slice('shared/'.length);
      } else {
        baseDir = rendererRoot;
      }

      // Default to index.html for root
      if (!pathname) pathname = 'index.html';

      // Path traversal guard
      const safePath = resolve(baseDir, ...pathname.split('/'));
      if (!safePath.startsWith(normalize(baseDir))) {
        log.warn('Protocol: path traversal attempt:', request.url);
        return new Response('Forbidden', { status: 403 });
      }

      // Read file
      let body;
      try {
        body = await readFile(safePath);
      } catch {
        log.debug('Protocol 404:', safePath);
        return new Response('Not Found', { status: 404 });
      }

      // Determine MIME type
      const ext = safePath.slice(safePath.lastIndexOf('.')).toLowerCase();
      const contentType = MIME[ext] ?? 'application/octet-stream';

      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Security-Policy': CSP,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      });
    } catch (err) {
      log.error('Protocol handler error:', err);
      return new Response('Internal Error', { status: 500 });
    }
  });
}
