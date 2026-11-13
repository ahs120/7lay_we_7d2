// src/main/services/errors.js
// Application error class and IPC error serialisation helpers.

import { ERROR_CODES } from '../../shared/constants.js';
import { isDev } from './runtime.js';

/** Structured application error. Always has a machine-readable `code`. */
export class AppError extends Error {
  /**
   * @param {string} code   - One of ERROR_CODES
   * @param {string} message
   * @param {object} [details] - Extra fields sent to the renderer
   */
  constructor(code, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }

  // ── Static factories ────────────────────────────────────────────────────

  static validation(message, details) {
    return new AppError(ERROR_CODES.VALIDATION, message, details);
  }

  static notFound(message = 'Not found') {
    return new AppError(ERROR_CODES.NOT_FOUND, message);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(ERROR_CODES.FORBIDDEN, message);
  }

  static unauthenticated(message = 'Unauthenticated') {
    return new AppError(ERROR_CODES.UNAUTHENTICATED, message);
  }

  static conflict(message) {
    return new AppError(ERROR_CODES.CONFLICT, message);
  }
}

/**
 * Convert any thrown value into a plain object safe to send over IPC.
 * Hides internal error messages in production.
 *
 * @param {unknown} err
 * @returns {{ ok: false, code: string, message: string, details?: object }}
 */
export function toErrorPayload(err) {
  if (err instanceof AppError) {
    const payload = { ok: false, code: err.code, message: err.message };
    if (err.details !== undefined) payload.details = err.details;
    return payload;
  }

  // SQLite constraint violation → CONFLICT
  if (err instanceof Error && err.code === 'SQLITE_CONSTRAINT') {
    return { ok: false, code: ERROR_CODES.CONFLICT, message: 'Conflict' };
  }

  // Other SQLite errors → DB_ERROR
  if (err instanceof Error && typeof err.code === 'string' && err.code.startsWith('SQLITE_')) {
    return { ok: false, code: ERROR_CODES.DB_ERROR, message: 'Database error' };
  }

  // Unknown errors — hide details in production
  const message = isDev && err instanceof Error ? err.message : 'Internal error';
  return { ok: false, code: ERROR_CODES.INTERNAL, message };
}

