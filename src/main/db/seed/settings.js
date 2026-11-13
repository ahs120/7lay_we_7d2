// src/main/db/seed/settings.js
// Default settings inserted on first boot.

export const DEFAULT_SETTINGS = {
  'restaurant_name_ar': 'مطعم محمد فوزي',
  'service_bp':         '1200',   // 12%
  'tax_bp':             '1400',   // 14%
  'tax_inclusive':      '0',      // exclusive (added on top)
  'rounding_mode':      'none',   // 'none' | '50qirsh' | 'pound'
  'order_no_scope':     'day',    // 'day' | 'shift'
  'day_start_hour':     '5',      // new day starts at 5 AM Cairo time
  'backup.dir':         '',       // empty = use default backups dir
  'backup.keep':        '10',     // keep last N auto backups
  'currency.code':      'EGP',
  'currency.symbol':    'ج.م',
  'currency.minor':     '100',    // piasters per pound
};

