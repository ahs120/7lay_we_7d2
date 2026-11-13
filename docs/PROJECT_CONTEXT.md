# PROJECT CONTEXT

## PROJECT
- Windows desktop POS for Egyptian restaurant "Mohamed Fawzy" (slogan «حدّق وحلّي»).
- Offline 100%: no CDN/API/Google Fonts/network at runtime.

## STACK
- Electron (pinned exact latest stable) + HTML/CSS/Vanilla JS ES Modules (no React/Vue/Tailwind-CDN)
- better-sqlite3
- electron-builder NSIS x64
- Local libs: chart.js, jsbarcode, exceljs, bcryptjs, electron-log, @fontsource/cairo, @fontsource/aref-ruqaa, lucide-static
- UI: Arabic (Egyptian) RTL, Western digits 0-9 (configurable), currency "ج.م", timezone Africa/Cairo
- Code/comments English; UI strings only in src/renderer/i18n/ar.js

## VISUAL TOKENS
- Colors:
  - --bg: #F2E3CA
  - --surface: #FBF5E6
  - --surface-2: #E6D5BB
  - --primary: #A4522F
  - --primary-dark: #7A3B2A
  - --text: #4B2C1E
  - --text-muted: #8A6A55
  - --gold: #B8955E
  - --accent: #E8742C
  - --success: #6B7A3A
  - --danger: #B3261E
- Fonts: Cairo (UI), Aref Ruqaa (headings/brand)
- Design parameters: Radius 12px, thin gold borders, faint Islamic pattern (opacity <= 6%), touch targets >= 48px, must work at 1366x768 and 1920x1080

## STRUCTURE
- src/main/{main.js, ipc/<domain>.js, db/connection.js, db/migrations/NNN_name.sql, db/repositories/<domain>.js, services/}
- src/preload/preload.js (exposes window.api only)
- src/renderer/{index.html, router.js, pages/<name>/<name>.html|js|css, components/, styles/, i18n/ar.js, assets/}
- src/shared/{constants.js, permissions.js, pricing.js}
- docs/PROJECT_CONTEXT.md
- build/icon.ico

## RULES
- Security: contextIsolation:true, nodeIntegration:false, sandbox:true, strict CSP; renderer never touches DB/fs, everything via IPC
- IPC: channel names "domain:action"; response always {ok:true,data} | {ok:false,error:{code,message}}; validation in main
- Database: All SQL only inside db/repositories. PRAGMA foreign_keys=ON, journal_mode=WAL; numbered migrations auto-run; any schema change after Part 2 = new migration
- Currency: Money = integer piasters everywhere (format only in UI)
- Dates: ISO UTC
- Data integrity: Every table has id, created_at, updated_at; soft delete via is_active unless stated
- Pages: Each page exports mount(container) and unmount()

## TABLES (fixed names)
- users, settings, audit_log, categories, products, product_sizes, addon_groups, addons, product_addon_groups, customers, dining_tables, delivery_drivers, shifts, orders, order_items, order_item_addons, payments, cash_movements, expenses, suppliers, inventory_items, recipes, stock_movements, purchase_invoices, purchase_invoice_items

## ENUMS
- roles: owner | manager | cashier | waiter
- order types: dine_in | takeaway | delivery
- order status: open | held | paid | cancelled | refunded
- kitchen_status: new | preparing | ready | served
- payment methods: cash | card | wallet | credit
- Permissions are strings like orders.create, orders.discount, orders.void, reports.view, settings.edit

## DECISIONS LOG (Part 1)
- ESM everywhere except preload (CJS via src/preload/package.json)
- Custom privileged protocol app://local/ (maps /shared/* to src/shared, everything else to src/renderer)
- CSP forbids inline styles and inline event handlers
- Rates stored as basis points (1400 = 14%)
- Renderer maps error.code to Arabic text
- Renderer libs vendored into src/renderer/vendor by `npm run assets` and committed
- Part 1 session is a TEMP owner stub (remove in Part 3)

## ROADMAP (assumed)
1. Foundation
2. DB
3. Auth/Users/Settings
4. Menu
5. POS/Orders
6. Payments/Shifts
7. Kitchen/Tables/Delivery
8. Printing
9. Inventory/Purchases/Expenses
10. Reports/Backup

## CONTRACT DELTA LOG

