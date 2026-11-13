-- src/main/db/migrations/001_init.sql
-- Initial schema for Mohamed Fawzy POS.
-- All monetary values: INTEGER in piasters (1 EGP = 100 piasters).
-- All rates/percentages: INTEGER in basis points (10000 = 100%).
-- All timestamps: TEXT ISO 8601 UTC (e.g. '2026-11-13T04:00:00.000Z').
-- business_date: TEXT 'YYYY-MM-DD' in Africa/Cairo timezone (exception to UTC rule).
-- Soft delete: is_active = 0 (never hard-delete menu/users/customers).
-- Orders and payments are never deleted; cancelled via status + reason.

-- ═══════════════════════════════════════════════════════════════
-- 1. SYSTEM
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     INTEGER PRIMARY KEY,  -- e.g. 1 for 001_init.sql
  name        TEXT    NOT NULL,
  checksum    TEXT    NOT NULL,      -- SHA-256 of the SQL file
  applied_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE settings (
  key         TEXT    PRIMARY KEY,
  value       TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT    NOT NULL,  -- e.g. 'order.cancel', 'shift.close'
  entity      TEXT,              -- table name
  entity_id   INTEGER,
  before_json TEXT,
  after_json  TEXT,
  note        TEXT
);

CREATE TABLE order_counters (
  scope       TEXT    PRIMARY KEY,  -- 'D:YYYY-MM-DD' or 'S:<shift_id>'
  last_no     INTEGER NOT NULL DEFAULT 0 CHECK(last_no >= 0)
);

-- ═══════════════════════════════════════════════════════════════
-- 2. USERS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  username         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  pin_hash         TEXT,           -- bcrypt hash; NULL = no PIN required
  role             TEXT    NOT NULL CHECK(role IN ('owner','manager','cashier','waiter')),
  permissions_json TEXT    NOT NULL DEFAULT '{}',  -- per-user overrides (Part 3)
  is_active        INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ═══════════════════════════════════════════════════════════════
-- 3. MENU
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar     TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  is_demo     INTEGER NOT NULL DEFAULT 0 CHECK(is_demo IN (0,1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name_ar         TEXT    NOT NULL,
  description_ar  TEXT,
  base_price      INTEGER NOT NULL CHECK(base_price >= 0),  -- piasters; 0 if size-based
  has_sizes       INTEGER NOT NULL DEFAULT 0 CHECK(has_sizes IN (0,1)),
  prep_station    TEXT    NOT NULL DEFAULT 'kitchen' CHECK(prep_station IN ('kitchen','bar','cold')),
  service_exempt  INTEGER NOT NULL DEFAULT 0 CHECK(service_exempt IN (0,1)),
  tax_exempt      INTEGER NOT NULL DEFAULT 0 CHECK(tax_exempt IN (0,1)),
  is_available    INTEGER NOT NULL DEFAULT 1 CHECK(is_available IN (0,1)),
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  is_demo         INTEGER NOT NULL DEFAULT 0 CHECK(is_demo IN (0,1)),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE item_sizes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id     INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  name_ar     TEXT    NOT NULL,   -- e.g. 'صغير', 'وسط', 'كبير'
  price       INTEGER NOT NULL CHECK(price >= 0),  -- piasters
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  UNIQUE(item_id, name_ar)
);

CREATE TABLE modifier_groups (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar      TEXT    NOT NULL,
  min_select   INTEGER NOT NULL DEFAULT 0 CHECK(min_select >= 0),
  max_select   INTEGER NOT NULL DEFAULT 1 CHECK(max_select >= 1),
  is_required  INTEGER NOT NULL DEFAULT 0 CHECK(is_required IN (0,1)),
  is_active    INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE modifier_options (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id     INTEGER NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name_ar      TEXT    NOT NULL,
  price_delta  INTEGER NOT NULL DEFAULT 0,  -- piasters; can be negative (discount)
  is_active    INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- Many-to-many: items ↔ modifier_groups
CREATE TABLE item_modifier_groups (
  item_id      INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  group_id     INTEGER NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(item_id, group_id)
);

-- ═══════════════════════════════════════════════════════════════
-- 4. DINING TABLES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE dining_tables (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT    NOT NULL UNIQUE,  -- e.g. 'T1', 'T9'
  name_ar     TEXT,
  area        TEXT    NOT NULL DEFAULT 'صالة' CHECK(area IN ('صالة','تراس','خارجي','بار')),
  capacity    INTEGER NOT NULL DEFAULT 4 CHECK(capacity > 0),
  status      TEXT    NOT NULL DEFAULT 'free' CHECK(status IN ('free','occupied','reserved','dirty')),
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  is_demo     INTEGER NOT NULL DEFAULT 0 CHECK(is_demo IN (0,1)),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ═══════════════════════════════════════════════════════════════
-- 5. CUSTOMERS & DELIVERY
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE customers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  phone       TEXT    NOT NULL UNIQUE,
  address     TEXT,
  notes       TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE delivery_zones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar     TEXT    NOT NULL UNIQUE,
  fee         INTEGER NOT NULL DEFAULT 0 CHECK(fee >= 0),  -- piasters
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE drivers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  phone       TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ═══════════════════════════════════════════════════════════════
-- 6. SHIFTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE shifts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  opened_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  closed_by       INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  status          TEXT    NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
  opening_cash    INTEGER NOT NULL DEFAULT 0 CHECK(opening_cash >= 0),  -- piasters
  closing_cash    INTEGER,          -- NULL until closed
  expected_cash   INTEGER,          -- calculated at close
  notes           TEXT,
  opened_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  closed_at       TEXT
);

-- Only one open shift at a time
CREATE UNIQUE INDEX uq_shifts_open ON shifts(status) WHERE status = 'open';

-- ═══════════════════════════════════════════════════════════════
-- 7. ORDERS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id         INTEGER NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
  table_id         INTEGER REFERENCES dining_tables(id) ON DELETE RESTRICT,
  customer_id      INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
  driver_id        INTEGER REFERENCES drivers(id) ON DELETE RESTRICT,
  created_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_type       TEXT    NOT NULL CHECK(order_type IN ('dine_in','takeaway','delivery')),
  status           TEXT    NOT NULL DEFAULT 'open'
                           CHECK(status IN ('open','sent','ready','completed','cancelled')),
  -- Scope and number for display (e.g. "D:2026-11-13 #42")
  order_scope      TEXT    NOT NULL,   -- 'D:YYYY-MM-DD' or 'S:<shift_id>'
  order_no         INTEGER NOT NULL,
  -- Snapshots at time of sale (rates from settings)
  service_bp       INTEGER NOT NULL DEFAULT 0 CHECK(service_bp BETWEEN 0 AND 10000),
  tax_bp           INTEGER NOT NULL DEFAULT 0 CHECK(tax_bp BETWEEN 0 AND 10000),
  tax_inclusive    INTEGER NOT NULL DEFAULT 0 CHECK(tax_inclusive IN (0,1)),
  -- Calculated totals (piasters)
  subtotal         INTEGER NOT NULL DEFAULT 0 CHECK(subtotal >= 0),
  service_amount   INTEGER NOT NULL DEFAULT 0 CHECK(service_amount >= 0),
  tax_amount       INTEGER NOT NULL DEFAULT 0 CHECK(tax_amount >= 0),
  discount_total   INTEGER NOT NULL DEFAULT 0 CHECK(discount_total >= 0),
  delivery_fee     INTEGER NOT NULL DEFAULT 0 CHECK(delivery_fee >= 0),
  rounding         INTEGER NOT NULL DEFAULT 0,  -- can be negative (round down)
  total            INTEGER NOT NULL DEFAULT 0 CHECK(total >= 0),
  paid_total       INTEGER NOT NULL DEFAULT 0 CHECK(paid_total >= 0),
  -- Delivery details (snapshot)
  delivery_address TEXT,
  cancel_reason    TEXT,
  notes            TEXT,
  business_date    TEXT    NOT NULL,  -- 'YYYY-MM-DD' Africa/Cairo (exception to UTC rule)
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  -- Constraints
  CHECK(order_type <> 'dine_in'   OR table_id IS NOT NULL),
  CHECK(order_type <> 'delivery'  OR delivery_address IS NOT NULL),
  UNIQUE(order_scope, order_no)
);

CREATE TABLE order_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  item_id         INTEGER REFERENCES items(id) ON DELETE RESTRICT,  -- NULL if item was deleted
  size_id         INTEGER REFERENCES item_sizes(id) ON DELETE RESTRICT,
  -- Snapshots
  name_ar         TEXT    NOT NULL,  -- item name at time of order
  size_name_ar    TEXT,              -- size name, if sized
  unit_price      INTEGER NOT NULL CHECK(unit_price >= 0),  -- piasters incl. modifiers
  base_price      INTEGER NOT NULL CHECK(base_price >= 0),
  modifiers_total INTEGER NOT NULL DEFAULT 0,
  qty             INTEGER NOT NULL DEFAULT 1 CHECK(qty > 0),
  line_total      INTEGER NOT NULL CHECK(line_total >= 0),  -- unit_price * qty
  service_exempt  INTEGER NOT NULL DEFAULT 0 CHECK(service_exempt IN (0,1)),
  tax_exempt      INTEGER NOT NULL DEFAULT 0 CHECK(tax_exempt IN (0,1)),
  prep_station    TEXT    NOT NULL DEFAULT 'kitchen',
  kitchen_status  TEXT    NOT NULL DEFAULT 'new'
                          CHECK(kitchen_status IN ('new','preparing','ready','served')),
  notes           TEXT,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE order_item_modifiers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_item_id   INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  option_id       INTEGER REFERENCES modifier_options(id) ON DELETE RESTRICT,
  -- Snapshots
  group_name_ar   TEXT    NOT NULL,
  option_name_ar  TEXT    NOT NULL,
  price_delta     INTEGER NOT NULL DEFAULT 0,
  qty             INTEGER NOT NULL DEFAULT 1 CHECK(qty > 0)
);

-- ═══════════════════════════════════════════════════════════════
-- 8. DISCOUNTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE discounts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar     TEXT    NOT NULL,
  type        TEXT    NOT NULL CHECK(type IN ('percent','fixed')),
  value       INTEGER NOT NULL CHECK(value > 0),  -- bp for percent; piasters for fixed
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE order_discounts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  discount_id  INTEGER REFERENCES discounts(id) ON DELETE RESTRICT,
  -- Snapshot
  name_ar      TEXT    NOT NULL,
  type         TEXT    NOT NULL CHECK(type IN ('percent','fixed')),
  value        INTEGER NOT NULL CHECK(value > 0),
  amount       INTEGER NOT NULL CHECK(amount >= 0),  -- resolved amount in piasters
  applied_by   INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  applied_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ═══════════════════════════════════════════════════════════════
-- 9. PAYMENTS & CASH MOVEMENTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  shift_id    INTEGER NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
  method      TEXT    NOT NULL CHECK(method IN ('cash','card','instapay','wallet')),
  amount      INTEGER NOT NULL CHECK(amount > 0),  -- piasters
  reference   TEXT,   -- card/wallet reference number
  paid_by     INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  paid_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE cash_movements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_id    INTEGER NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
  type        TEXT    NOT NULL CHECK(type IN ('in','out')),
  amount      INTEGER NOT NULL CHECK(amount > 0),  -- piasters
  reason      TEXT    NOT NULL,
  created_by  INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ═══════════════════════════════════════════════════════════════
-- 10. PRINTERS (structure for Part 8)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE printers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  type        TEXT    NOT NULL DEFAULT 'thermal' CHECK(type IN ('thermal','a4')),
  connection  TEXT    NOT NULL DEFAULT 'usb' CHECK(connection IN ('usb','network','windows')),
  address     TEXT,   -- IP:port for network printers
  paper_width INTEGER NOT NULL DEFAULT 80,  -- mm: 58 or 80
  station     TEXT    NOT NULL DEFAULT 'cashier' CHECK(station IN ('cashier','kitchen','bar','cold')),
  is_default  INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0,1)),
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ═══════════════════════════════════════════════════════════════
-- 11. INVENTORY
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE suppliers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  phone       TEXT,
  notes       TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE stock_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar       TEXT    NOT NULL,
  unit          TEXT    NOT NULL,   -- e.g. 'جرام', 'مل', 'قطعة'
  unit_size     INTEGER NOT NULL DEFAULT 1 CHECK(unit_size > 0),  -- smallest unit multiplier
  current_qty   INTEGER NOT NULL DEFAULT 0,  -- in smallest units
  reorder_level INTEGER NOT NULL DEFAULT 0 CHECK(reorder_level >= 0),
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE stock_movements (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_item_id INTEGER NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  shift_id     INTEGER REFERENCES shifts(id) ON DELETE RESTRICT,
  type         TEXT    NOT NULL CHECK(type IN ('in','out','adjustment','waste')),
  qty          INTEGER NOT NULL,  -- positive = in, negative = out/waste
  reason       TEXT,
  created_by   INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Recipe: maps item (or item_size) to stock ingredients
CREATE TABLE recipe_lines (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id        INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  size_id        INTEGER REFERENCES item_sizes(id) ON DELETE CASCADE,  -- NULL = all sizes
  stock_item_id  INTEGER NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  qty_per_unit   INTEGER NOT NULL CHECK(qty_per_unit > 0)  -- in smallest stock units
);

CREATE TABLE purchases (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id  INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT,
  total        INTEGER NOT NULL CHECK(total >= 0),  -- piasters
  notes        TEXT,
  created_by   INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE purchase_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id     INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  stock_item_id   INTEGER NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  qty             INTEGER NOT NULL CHECK(qty > 0),
  unit_cost       INTEGER NOT NULL CHECK(unit_cost >= 0),  -- piasters per unit
  total_cost      INTEGER NOT NULL CHECK(total_cost >= 0)
);

-- ═══════════════════════════════════════════════════════════════
-- 12. EXPENSES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE expense_categories (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar   TEXT    NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1))
);

CREATE TABLE expenses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id  INTEGER REFERENCES expense_categories(id) ON DELETE RESTRICT,
  shift_id     INTEGER REFERENCES shifts(id) ON DELETE RESTRICT,
  amount       INTEGER NOT NULL CHECK(amount > 0),  -- piasters
  description  TEXT    NOT NULL,
  created_by   INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX idx_orders_business_date  ON orders(business_date);
CREATE INDEX idx_orders_shift_id       ON orders(shift_id);
CREATE INDEX idx_orders_status         ON orders(status);
CREATE INDEX idx_order_items_order_id  ON order_items(order_id);
CREATE INDEX idx_payments_shift_id     ON payments(shift_id);
CREATE INDEX idx_items_category_id     ON items(category_id);
CREATE INDEX idx_customers_phone       ON customers(phone);
CREATE INDEX idx_audit_log_ts          ON audit_log(ts);
CREATE INDEX idx_stock_movements_item  ON stock_movements(stock_item_id);

