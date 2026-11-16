// src/renderer/utils/format.js
// Date, time, money, number formatting utilities.
// RULES:
//   - formatMoney THROWS on non-integer input
//   - Integer math only — no float arithmetic
//   - Money values are piasters (integers): 1500 = 15.00 ج.م
//   - Dates displayed in Africa/Cairo timezone
//   - ASCII commas/dots used (not Arabic numerals) in latn mode
//   - -0 prints as 0.00

import { CURRENCY, TIMEZONE } from '../../shared/constants.js';

/** @type {{ locale: string, currency: typeof CURRENCY }} */
let _config = {
  locale: 'ar-EG',
  currency: CURRENCY,
};

/**
 * Configure the formatter. Call once during boot with app info.
 * @param {{ locale?: string, currency?: typeof CURRENCY }} opts
 */
export function configureFormat(opts = {}) {
  _config = { ..._config, ...opts };
}

// ── Number formatting ─────────────────────────────────────────────────────

/**
 * Convert Arabic/Eastern Arabic digits to ASCII digits.
 * @param {string} str
 * @returns {string}
 */
export function normalizeDigits(str) {
  return str
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)) // Eastern Arabic
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0)); // Extended Arabic-Indic
}

/**
 * Format a number with locale-aware formatting.
 * Uses ASCII digits always.
 * @param {number} value
 * @param {Intl.NumberFormatOptions} [opts]
 * @returns {string}
 */
export function formatNumber(value, opts = {}) {
  const formatted = new Intl.NumberFormat('ar-EG-u-nu-latn', opts).format(value);
  return normalizeDigits(formatted);
}

// ── Money formatting ──────────────────────────────────────────────────────

/**
 * Format an integer piaster value as a money string.
 * THROWS if value is not a safe integer.
 * @param {number} piasters — integer (e.g. 1500 = 15.00 ج.م)
 * @param {object} [opts]
 * @param {boolean} [opts.showSymbol] — default true
 * @param {boolean} [opts.showSign]   — show + for positive
 * @returns {string}
 */
export function formatMoney(piasters, opts = {}) {
  if (typeof piasters !== 'number' || Number.isNaN(piasters)) {
    throw new TypeError(`formatMoney: expected integer, got ${piasters}`);
  }
  if (!Number.isFinite(piasters)) {
    throw new RangeError(`formatMoney: value is not finite: ${piasters}`);
  }
  if (!Number.isInteger(piasters)) {
    throw new TypeError(`formatMoney: expected integer piasters, got ${piasters} (float)`);
  }
  if (!Number.isSafeInteger(piasters)) {
    throw new RangeError(`formatMoney: value out of safe integer range: ${piasters}`);
  }

  const { showSymbol = true, showSign = false } = opts;

  // Handle -0
  const v = Object.is(piasters, -0) ? 0 : piasters;

  // Integer division: piasters → major.minor
  const sign = v < 0 ? -1 : 1;
  const abs = Math.abs(v);
  const major = Math.floor(abs / _config.currency.minorUnit);
  const minor = abs % _config.currency.minorUnit;

  // Format: pad minor to 2 digits
  const minorStr = String(minor).padStart(2, '0');
  let result = `${major}.${minorStr}`;

  if (sign < 0) result = `-${result}`;
  else if (showSign && v > 0) result = `+${result}`;

  if (showSymbol) result = `${result} ${_config.currency.symbol}`;

  return result;
}

/**
 * Format basis points as percentage string.
 * @param {number} bps — integer basis points (e.g. 1400 = 14%)
 * @returns {string}
 */
export function formatPercentBps(bps) {
  if (!Number.isInteger(bps)) {
    throw new TypeError(`formatPercentBps: expected integer bps, got ${bps}`);
  }
  // bps / 100 = percentage with up to 2 decimal places
  const whole = Math.floor(Math.abs(bps) / 100);
  const frac = Math.abs(bps) % 100;
  const sign = bps < 0 ? '-' : '';
  if (frac === 0) return `${sign}${whole}%`;
  return `${sign}${whole}.${String(frac).padStart(2, '0')}%`;
}

/**
 * Parse a money string to integer piasters.
 * Accepts: "15.00", "15", "١٥.٠٠" (Arabic digits normalized).
 * @param {string} str
 * @returns {number} integer piasters, or NaN on failure
 */
export function parseMoney(str) {
  const normalized = normalizeDigits(String(str).trim().replace(/[,\s]/g, ''));
  const float = parseFloat(normalized);
  if (isNaN(float)) return NaN;
  // Round to nearest piaster
  return Math.round(float * _config.currency.minorUnit);
}

// ── Date / Time formatting ────────────────────────────────────────────────

/** @type {Intl.DateTimeFormat} */
let _dateFormatter = null;
let _timeFormatter = null;
let _dateTimeFormatter = null;

function getDateFormatter() {
  if (!_dateFormatter) {
    _dateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
  return _dateFormatter;
}

function getTimeFormatter() {
  if (!_timeFormatter) {
    _timeFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }
  return _timeFormatter;
}

function getDateTimeFormatter() {
  if (!_dateTimeFormatter) {
    _dateTimeFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  return _dateTimeFormatter;
}

/**
 * Format a date to display string in Cairo timezone.
 * @param {string|Date|number} value — ISO string, Date, or timestamp
 * @returns {string}
 */
export function formatDate(value) {
  const d = toDate(value);
  return normalizeDigits(getDateFormatter().format(d));
}

/**
 * Format a time to HH:MM:SS in Cairo timezone.
 * @param {string|Date|number} value
 * @returns {string}
 */
export function formatTime(value) {
  const d = toDate(value);
  return normalizeDigits(getTimeFormatter().format(d));
}

/**
 * Format a datetime string in Cairo timezone.
 * @param {string|Date|number} value
 * @returns {string}
 */
export function formatDateTime(value) {
  const d = toDate(value);
  return normalizeDigits(getDateTimeFormatter().format(d));
}

/**
 * Format a business date string (YYYY-MM-DD) for display.
 * @param {string} isoDate — YYYY-MM-DD
 * @returns {string}
 */
export function formatBusinessDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  // Parse as local midnight Cairo (treat as already in Cairo TZ)
  // Display as DD/MM/YYYY
  const [year, month, day] = isoDate.split('-');
  return normalizeDigits(`${day}/${month}/${year}`);
}

/**
 * Format a duration in seconds to HH:MM:SS or MM:SS.
 * @param {number} seconds — integer seconds
 * @param {object} [opts]
 * @param {boolean} [opts.forceHours] — always show hours
 * @returns {string}
 */
export function formatDuration(seconds, opts = {}) {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '--:--';
  const abs = Math.abs(Math.floor(seconds));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const sign = seconds < 0 ? '-' : '';

  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  if (h > 0 || opts.forceHours) {
    const hh = String(h).padStart(2, '0');
    return `${sign}${hh}:${mm}:${ss}`;
  }
  return `${sign}${mm}:${ss}`;
}

/**
 * Get current time in Cairo timezone as a Date.
 * @returns {Date}
 */
export function cairoNow() {
  return new Date();
}

/**
 * Get today's business date string (YYYY-MM-DD) in Cairo timezone.
 * @param {number} [dayStartHour] — hour of day start (default 5 AM)
 * @returns {string}
 */
export function todayCairo(dayStartHour = 5) {
  const now = new Date();
  // Get Cairo time parts
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);

  // If before dayStartHour, business date is yesterday
  if (hour < dayStartHour) {
    const d = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') return new Date(value);
  throw new TypeError(`formatDate: invalid value: ${value}`);
}
