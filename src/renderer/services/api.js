// src/renderer/services/api.js
// Typed IPC wrapper around window.api with structured errors and safeCall.

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]
   * @param {any} [details]
   */
  constructor(message, code = 'INTERNAL', details = null) {
    super(message || code);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Invoke an IPC channel and return the unwrapped data payload.
 * Throws ApiError on non-ok response.
 * @template T
 * @param {string} channel
 * @param {any} [payload]
 * @returns {Promise<T>}
 */
export async function call(channel, payload) {
  if (typeof window === 'undefined' || !window.api || typeof window.api.invoke !== 'function') {
    throw new ApiError('Window API unavailable', 'api_unavailable');
  }

  const res = await window.api.invoke(channel, payload);
  if (!res || res.ok !== true) {
    const code = res?.code || 'UNKNOWN';
    const message = res?.message || code;
    throw new ApiError(message, code, res?.data ?? null);
  }

  return res.data;
}

/**
 * Invoke an IPC channel safely without throwing.
 * @template T
 * @param {string} channel
 * @param {any} [payload]
 * @returns {Promise<{ ok: true, data: T } | { ok: false, error: ApiError }>}
 */
export async function safeCall(channel, payload) {
  try {
    const data = await call(channel, payload);
    return { ok: true, data };
  } catch (err) {
    const error = err instanceof ApiError
      ? err
      : new ApiError(err?.message || 'Unknown error', 'INTERNAL', err);
    return { ok: false, error };
  }
}

/**
 * Subscribe to an IPC push event.
 * @param {string} channel
 * @param {(payload: any) => void} listener
 * @returns {() => void} unsubscribe function
 */
export function on(channel, listener) {
  if (typeof window === 'undefined' || !window.api || typeof window.api.on !== 'function') {
    console.warn(`api.on: window.api.on is not available for channel "${channel}"`);
    return () => {};
  }
  return window.api.on(channel, listener);
}
