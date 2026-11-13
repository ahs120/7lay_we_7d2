// src/shared/constants.js
// Shared between main process and renderer (via app:// protocol).
// Keep this file free of Node.js-only APIs.

export const APP_NAME_AR = 'كاشير محمد فوزي';
export const APP_DIR_NAME = 'MohamedFawzyPOS';
export const APP_ID = 'com.mohamedfawzy.pos';
export const APP_ORIGIN = 'app://local';

/** Channel name pattern: domain:Action (e.g. app:ping, order:create) */
export const CHANNEL_REGEX = /^[a-z][a-z0-9]*:[a-zA-Z][a-zA-Z0-9]*$/;

export const ROLES = Object.freeze({
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER: 'waiter'
});

export const ORDER_TYPES = Object.freeze({
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery'
});

export const ORDER_STATUS = Object.freeze({
  OPEN: 'open',
  HELD: 'held',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
});

export const KITCHEN_STATUS = Object.freeze({
  NEW: 'new',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served'
});

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  CARD: 'card',
  WALLET: 'wallet',
  CREDIT: 'credit'
});

export const CURRENCY = Object.freeze({
  code: 'EGP',
  symbol: 'ج.م',
  minorUnit: 100
});

export const TIMEZONE = 'Africa/Cairo';

export const DEFAULT_RATES_BPS = Object.freeze({
  service: 0,
  tax: 0
});

export const ERROR_CODES = Object.freeze({
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  CONFLICT: 'CONFLICT',
  DB_ERROR: 'DB_ERROR',
  INTERNAL: 'INTERNAL',
  UNKNOWN_CHANNEL: 'UNKNOWN_CHANNEL',
  BAD_CHANNEL: 'BAD_CHANNEL',
  BAD_SENDER: 'BAD_SENDER'
});
