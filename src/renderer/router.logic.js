// src/renderer/router.logic.js
// Pure hash parsing, building, and route matching functions.

/**
 * Normalize route path (strip trailing slash except root, ensure leading slash).
 * @param {string} path
 * @returns {string}
 */
export function normalizePath(path = '') {
  if (!path || path === '/') return '/';
  let p = path.trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.endsWith('/') && p.length > 1) p = p.slice(0, -1);
  return p;
}

/**
 * Parse browser location.hash into path and query object.
 * e.g. "#/cashier?table=5&mode=fast" -> { path: '/cashier', query: { table: '5', mode: 'fast' } }
 * @param {string} hash
 * @returns {{ path: string, query: Record<string, string> }}
 */
export function parseHash(hash = '') {
  let h = hash.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (!h) return { path: '/', query: {} };

  const qIdx = h.indexOf('?');
  let rawPath = qIdx === -1 ? h : h.slice(0, qIdx);
  const rawQuery = qIdx === -1 ? '' : h.slice(qIdx + 1);

  const path = normalizePath(rawPath);
  const query = {};

  if (rawQuery) {
    const params = new URLSearchParams(rawQuery);
    for (const [k, v] of params.entries()) {
      query[k] = v;
    }
  }

  return { path, query };
}

/**
 * Build hash string from path and query object.
 * @param {string} path
 * @param {Record<string, string|number>} [query]
 * @returns {string} e.g. "#/cashier?table=5"
 */
export function buildHash(path, query = null) {
  const norm = normalizePath(path);
  if (!query || Object.keys(query).length === 0) {
    return `#${norm}`;
  }

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) {
      params.set(k, String(v));
    }
  }

  const qs = params.toString();
  return qs ? `#${norm}?${qs}` : `#${norm}`;
}

/**
 * Find matching route configuration for a given path.
 * @param {Array<{ path: string, [key: string]: any }>} routes
 * @param {string} path
 * @returns {{ path: string, [key: string]: any } | null}
 */
export function matchRoute(routes, path) {
  const norm = normalizePath(path);
  return routes.find(r => normalizePath(r.path) === norm) || null;
}
