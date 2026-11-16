# PROJECT_CONTEXT.md — كاشير محمد فوزي
**عقد المشروع (Living Contract)**  
آخر تحديث: الجزء 1

---

## 1. نظرة عامة

| البند | القيمة |
|-------|--------|
| اسم المنتج (عربي) | كاشير محمد فوزي |
| اسم المنتج (ASCII) | MohamedFawzyPOS |
| appId | com.mohamedfawzy.pos |
| النوع | Windows Desktop POS — Electron + Vanilla JS |
| الوضع | Offline-first، لا cloud، لا CDN |
| المنصة | Windows 10/11 x64 |
| Electron | 45.x (أحدث 45.y مثبّت بالضبط، بدون ^) |
| Node.js | LTS 22+ |
| قاعدة البيانات | SQLite عبر better-sqlite3 ≥ 13 (N-API) |

---

## 2. هيكل الفولدرات

```
src/
├── main/              ← Main process
│   ├── main.js
│   ├── ipc/           ← handlers (auto-discovered)
│   ├── services/      ← errors, ipc, logger, native-check, protocol, runtime, validate
│   └── db/
│       ├── migrations/    ← (جزء 2)
│       └── repositories/  ← SQL هنا فقط
├── preload/
│   ├── package.json   ← {"type":"commonjs"}
│   └── preload.js     ← window.api — CommonJS فقط
├── renderer/          ← UI — Vanilla JS، لا Node APIs
│   ├── index.html
│   ├── boot.js        ← (مؤقت — يُستبدل في جزء UI)
│   ├── assets/
│   │   ├── logo.png
│   │   ├── fonts/
│   │   └── icons/
│   ├── components/    ← (جزء UI)
│   ├── pages/         ← (جزء UI)
│   ├── styles/        ← (جزء UI)
│   └── i18n/          ← (جزء UI)
└── shared/            ← constants, permissions, pricing
    ├── constants.js
    ├── permissions.js
    └── pricing.js

scripts/
├── check-sqlite.cjs
├── ensure-native.mjs
├── make-icon.mjs
└── make-placeholder-logo.cjs

build/        ← icon.ico (مُولَّد)
docs/         ← PROJECT_CONTEXT.md
release/      ← installer ناتج (مُهمَل في git)
tests/        ← node --test
```

---

## 3. القرارات المعمارية الثابتة

### 3.1 Module System
- `src/main/` و`src/shared/`: **ESM** (`"type":"module"` في package.json الجذر)
- `src/preload/preload.js`: **CommonJS** (Electron sandbox لا يدعم ESM في preload)
  - معه `src/preload/package.json` يحتوي `{"type":"commonjs"}`
- `scripts/`: ESM أو CJS حسب الامتداد (`.mjs` = ESM، `.cjs` = CJS)

### 3.2 Electron Import
```js
// صح ✅
import electron from 'electron';
const { app, BrowserWindow } = electron;

// غلط ❌
import { app } from 'electron';  // SyntaxError
```

### 3.3 بروتوكول app://local/
- بدل `file://` لأسباب CSP وES Modules والأمان
- `/shared/*` → `src/shared/`، كل شيء تاني → `src/renderer/`
- مسجّل بـ `protocol.registerSchemesAsPrivileged()` قبل app ready
- كل response يحمل CSP header كامل

### 3.4 CSP
```
default-src 'none';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
object-src 'none';
base-uri 'none';
form-action 'none';
frame-ancestors 'none'
```
**ممنوع**: `style=""`, `onclick=""`, أي inline script أو style.

### 3.5 IPC Architecture
- كل الـ handlers عبر `src/main/services/ipc.js` — لا `ipcMain` مباشرة
- Auto-discovery: كل ملف `*.js` في `src/main/ipc/` (ما عدا `index.js` و`_*`) يُسجَّل تلقائيًا
- كل module يصدّر `domain: string` و `register({handle, defineEvents, emit})`
- **Whitelist ديناميكية**: preload يسأل main عبر `ipc:channels` (sendSync) عند التحميل
  - ما في تعديل يدوي لـ preload.js لإضافة channel جديد
  - تسجيل handler جديد = whitelist تلقائي
- Channel naming: `domain:Action` — يطابق `/^[a-z][a-z0-9]*:[a-zA-Z][a-zA-Z0-9]*$/`

### 3.6 Renderer Security
- `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`
- `window.api` فقط: `invoke(channel, payload)` و `on(channel, cb)`
- لا `innerHTML` في أي مكان في renderer
- لا `window.open`، لا navigation لروابط خارجية

### 3.7 userData Paths
| الوضع | المسار |
|-------|--------|
| `npm run dev` | `%APPDATA%\MohamedFawzyPOS-dev\` |
| `npm start` / installer | `%APPDATA%\MohamedFawzyPOS\` |

### 3.8 SQL
**ممنوع خارج `src/main/db/repositories/`** — مع استثناءين محددين وموثقين:
1. ملفات `src/main/db/migrations/*.sql` والـ runner المسؤول عن تنفيذها (`src/main/db/migrate.js`).
2. استدعاءات `PRAGMA` الضرورية لضبط الاتصال في `src/main/db/connection.js`.
أي استعلام أو أمر SQL آخر محظور تمامًا خارج طبقة الـ repositories.

### 3.9 الأرقام المالية
- كل القيم بـ **piasters** (integers) — مثال: 1500 = 15.00 ج.م
- الضريبة والخدمة بـ **basis points** — مثال: 1400 = 14%
- تقريب half-up — لا float arithmetic
- المنطق في `src/shared/pricing.js`

### 3.10 التواريخ
- كل التواريخ واللقطات الزمنية مخزّنة كـ **ISO UTC strings** بصيغة ISO 8601 (مثل `2026-11-13T04:00:00.000Z`).
- **استثناء وحيد**: عمود `business_date` يُخزن كنص `YYYY-MM-DD` محسوب بتوقيت `Africa/Cairo` مع اعتبار ساعة بداية اليوم (`day_start_hour`، افتراضيًا 5 فجرًا)، وذلك لترقيم الطلبات اليومي والتقارير المحاسبية.
- العرض في الـ UI بتوقيت `Africa/Cairo`.

---

## 4. مكتبات الـ Renderer (devDependencies فقط)

| المكتبة | الاستخدام | ملاحظة |
|---------|-----------|--------|
| chart.js | رسوم بيانية | تُنسخ في جزء التقارير |
| jsbarcode | باركود | تُنسخ في جزء الطباعة |
| @fontsource/cairo | خط Cairo | تُنسخ في جزء UI |
| @fontsource/aref-ruqaa | خط Aref Ruqaa | تُنسخ في جزء UI |
| lucide-static | أيقونات SVG | تُنسخ في جزء UI |

الملفات المنسوخة تُضاف لـ `src/renderer/assets/` وتُعمل لها commit.

---

## 5. الصلاحيات (Permissions)

القيم الافتراضية في `src/shared/permissions.js`.  
تخصيص per-user في الجزء 3.

| الـ Role | المستوى |
|----------|---------|
| owner | كامل |
| manager | إدارة بدون تعديل إعدادات النظام |
| cashier | عمليات الكاشير |
| waiter | الطلبات فقط |

---

## 6. أوامر npm

```
npm start              → electron .
npm run dev            → electron . --dev
npm run selftest       → electron . --selftest
npm run check:native   → node scripts/ensure-native.mjs --check-only
npm run rebuild        → electron-rebuild -f -w better-sqlite3
npm run icon           → node scripts/make-icon.mjs
npm run dist           → (predist: icon + check:native) → electron-builder
npm run db:reset       → تفريغ وإعادة إنشاء وقراءة migrations والـ seed (للـ dev فقط)
npm run db:seed        → تطبيق الـ seed على الـ DB الحالية (--force لإعادة المنيو التجريبي)
npm run db:migrate     → تشغيل الـ migrations المعلقة
npm run test:db        → تشغيل اختبارات الـ DB داخل Electron Node mode
```

> **ملاحظة هامة للاختبارات**: بما أن `better-sqlite3` مبني لـ ABI الخاص بـ Electron، فإن تشغيل `node --test` المباشر سيفشل في تحميل الـ native module. لذلك يتم تشغيل اختبارات الـ DB عبر `npm run test:db` (التي تستخدم `scripts/run-electron-node.mjs`) حصريًا.

**في PowerShell دائمًا**:
```powershell
$env:ELECTRON_RUN_AS_NODE=""; npm.cmd run <script>
```

---

## 7. اصطلاحات الكود

- **اللغة**: الكود والتعليقات بالإنجليزي — النصوص العربية في `src/renderer/i18n/ar.js` فقط
- **أخطاء IPC**: main يرجع `code` فقط — renderer يحوّله لرسالة عربي من ar.js
- **تسمية الـ channels**: كل module يملك domain واحد — `app:ping`، `order:create`، إلخ

---

## 8. سكريبتات البناء

| الملف | الوظيفة |
|-------|---------|
| `scripts/check-sqlite.cjs` | يُشغَّل داخل Electron، يفحص better-sqlite3 بدون SQL |
| `scripts/ensure-native.mjs` | postinstall + check:native، يُعيد البناء تلقائيًا عند الفشل |
| `scripts/make-icon.mjs` | يحوّل logo.png → build/icon.ico عبر png2icons |
| `scripts/make-placeholder-logo.cjs` | يولّد logo.png مؤقت للتطوير — احذفه بعد وضع اللوجو الحقيقي |

---

## 9. الـ Installer

```yaml
appId: com.mohamedfawzy.pos
productName: "كاشير محمد فوزي"
artifactName: MohamedFawzyPOS-Setup-${version}.exe
target: nsis x64
perMachine: false        # per-user, لا يحتاج Admin
language: "1025"         # Arabic
deleteAppDataOnUninstall: false
```

---

## 10. ما تم إنجازه

### ✅ الجزء 1: الأساس (Foundation)
- [x] هيكل الفولدرات + `.gitignore` + `.gitattributes` + `.editorconfig` + `.npmrc`
- [x] `package.json` بالـ scripts الصحيحة
- [x] تثبيت كل الاعتماديات (better-sqlite3, electron, electron-builder, …)
- [x] `scripts/check-sqlite.cjs` + `scripts/ensure-native.mjs` (postinstall ذكي)
- [x] `src/shared/constants.js` (مع APP_NAME_AR, APP_DIR_NAME, APP_ID, CHANNEL_REGEX)
- [x] `src/shared/permissions.js` + `src/shared/pricing.js`
- [x] `src/main/services/runtime.js` (isDev, isSelfTest, isPackaged, hasFlag)
- [x] `src/main/services/errors.js` (AppError + toErrorPayload)
- [x] `src/main/services/validate.js` (v.string, v.int, v.bool, v.oneOf, v.object, v.array)
- [x] `src/main/services/logger.js` (initLogger, getLogFilePath, archiveLogFn)
- [x] `src/main/services/native-check.js` (checkSqlite — بدون SQL)
- [x] `src/main/services/ipc.js` (handle, defineEvents, emit, setAuthProvider, registerChannelListHandler)
- [x] `src/main/ipc/index.js` (auto-discovery)
- [x] `src/main/ipc/app.js` (app:ping, app:info, app:fullscreenChanged)
- [x] `src/main/services/protocol.js` (app://local/ مع path traversal guard + CSP)
- [x] `src/main/services/window.js` (BrowserWindow + F11 + fullscreen events + console forward)
- [x] `src/main/main.js` (boot sequence كامل + --selftest mode + --dev mode)
- [x] `src/preload/preload.js` (whitelist ديناميكية، لا hardcoded list)
- [x] `src/preload/package.json` ({"type":"commonjs"})
- [x] `src/renderer/index.html` (صفحة تشخيص — بدون inline style/script)
- [x] `src/renderer/boot.js` (ping + info + self-checks — بدون innerHTML)
- [x] `scripts/make-icon.mjs` (png2icons API)
- [x] `electron-builder.yml`
- [x] `README.md`

### ✅ الجزء 2: قاعدة البيانات SQLite (Database & Schema)
- [x] `src/main/db/paths.js`: مسار DB المستقل ومسارات الـ backups
- [x] `src/main/db/connection.js`: فتح الاتصال بـ WAL, synchronous=FULL, foreign_keys=ON, busy_timeout=5000 + integrityCheck + foreignKeyCheck
- [x] `scripts/run-electron-node.mjs`: تشغيل السكريبتات والاختبارات تحت Electron Node mode بعزل تام لـ ELECTRON_RUN_AS_NODE
- [x] `src/main/db/migrations/001_init.sql`: الـ Schema الكاملة (32 جدول) بجميع الـ constraints والفهارس
- [x] `src/main/db/migrate.js`: Migration runner بـ SHA-256 checksums وBEGIN IMMEDIATE وpre-migrate backup
- [x] `src/main/db/repositories/`: طبقة الـ Repositories الكاملة (18 وحدة عبر نمط Factory):
  - `system.repo.js`: فحص الجداول والـ PRAGMAs وفحص السلامة
  - `settings.repo.js`: إدارة الإعدادات key-value
  - `audit.repo.js`: سجل العمليات الحساسة
  - `order-counters.repo.js`: ترقيم الطلبات الذري عبر RETURNING في نفس الـ transaction
  - `users.repo.js`: إدارة المستخدمين والأدوار والـ PIN
  - `categories.repo.js` + `items.repo.js` + `modifiers.repo.js`: المنيو والأحجام والإضافات
  - `dining-tables.repo.js`: إدارة الصالات والترابيزات
  - `customers.repo.js` + `delivery.repo.js`: العملاء ومناطق ورسوم التوصيل والطيارين
  - `shifts.repo.js`: الورديات (مع قيد وردية مفتوحة واحدة فريدة)
  - `orders.repo.js`: إنشاء وحساب الطلبات وعناصرها ولقطات الأسعار والضرائب
  - `payments.repo.js`: المدفوعات وطرق الدفع
  - `discounts.repo.js`: الخصومات وتطبيقها
  - `cash-movements.repo.js`: حركات النقدية (توريد/سحب)
  - `inventory.repo.js`: المخزون والموردين وفواتير الشراء وحركات الأصناف
  - `expenses.repo.js`: المصروفات وتصنيفاتها
- [x] `src/main/db/seed/`: بذور البيانات الأولية (إعدادات النظام الافتراضية + منيو تجريبي 27 صنف بـ 6 أقسام + 12 ترابيزة)
- [x] `src/main/services/backup.js`:
  - لقطات حية بـ `db.backup()` مع فحص سلامة الملف فور إنشائه
  - تسمية معيارية وحفظ آخر 10 نسخ auto وحظر حذف النسخ اليدوية
  - استعادة swap-at-boot عبر marker لتفادي إغلاق ويندوز للملفات
- [x] `src/main/services/database.js`: إدارة دورة حياة قاعدة البيانات على الإقلاع
- [x] `src/main/ipc/db.js` + `src/main/ipc/backup.js`: قنوات `db:health`, `backup:run`, `backup:list`, `backup:chooseDir`, `backup:restore`
- [x] سكريبتات: `db:reset`, `db:seed`, `db:migrate`, `test:db`
- [x] حزمة الاختبارات الكاملة (24 اختبارًا ناجحًا في `tests/db/`):
  - `schema.test.mjs`
  - `constraints.test.mjs`
  - `order-counters.test.mjs`
  - `seed.test.mjs`
  - `backup.test.mjs`

### ✅ الجزء 3: نظام التصميم وهيكل التطبيق (Design System & App Shell)
- [x] خطوط محلية 100% (@fontsource/cairo و@fontsource/aref-ruqaa) مخدومة عبر `app://local/assets/fonts/` بدون أي طلب خارجي
- [x] حزمة الأيقونات (103 أيقونات SVG من lucide-static مولدة في `icons.js` وتُنشأ عبر `createElementNS` بدون أي innerHTML)
- [x] نمط الزخرفة الإسلامية `islamic-tile.svg` بنجمة ثمانية ولون الذهب
- [x] نظام المتغيرات `tokens.css` بألوان العقد الـ 11 والرموز المشتقة والمقاييس والظلال
- [x] الأساس `base.css` الداعم لـ RTL بالكامل وجميع الخصائص logical
- [x] أدوات DOM الآمنة: `dom.js` (دالة `h` مع حظر `innerHTML` و`style` و`onclick`)، `scope.js`، `focus.js`، `overlay.js`، `store.js`
- [x] نظام التعريب والتنسيق: `ar.js` الشامل، `t.js`، `format.js` (أرقام صحيحة بالقروش، تقريب، توقيت القاهرة)، ومكونات `money.js`
- [x] نظام اختصارات لوحة المفاتيح `shortcuts.js` المستقل عن لغة الكيبورد والمراعي للمفاتيح المحجوزة
- [x] مكتبة المكونات التفاعلية بمساحة لمس ≥ 48px:
  - `button.js`: كافة المتغيرات والحالات والأيقونات والتحميل
  - `input.js`: الحقول النصية والتسميات والأخطاء والبادئات واللواحق
  - `select.js`: قائمة منسدلة مخصصة معروضة في `#overlay-root`
  - `numpad.js` و`numpad.logic.js`: لوحة أرقام لمسية كبيرة بمفاتيح ≥ 64px
  - `modal.js`: نوافذ منبثقة مع عزل التمرير وحبس التركيز وسياق الاختصارات
  - `confirm.js`: حوارات تأكيد وحذف مبنية على Promises
  - `toast.js`: إشعارات عائمة بحد أقصى 3 وإيقاف مؤقت عند التمرير
  - `loading.js`: Spinner وBusy overlay بمؤقت مانع للوميض وSkeleton shimmer
  - `empty-state.js`: بطاقات الحالات الفارغة
  - `table.js` و`table.logic.js`: جداول بيانات برأس ثابت وترتيب وتقسيم صفحات
  - `tabs.js`: تبويبات متوافقة مع WAI-ARIA ودعم كامل لأسهم RTL
  - `badge.js` و`card.js`
- [x] راوتر الـ SPA المستند على Hash: `router.js` و`router.logic.js` مع حظر السباق (race condition) وفحص الصلاحيات و`canLeave`
- [x] جدول المسارات الكامل `routes.js` وصلاحياتها المرتبطة بـ `src/shared/permissions.js`
- [x] مخازن الحالة: `session.js` و`status.js` (تتبع الوردية والطابعة)
- [x] شاشة الإقلاع والـ Shell: `shell.js`، `sidebar.js`، `topbar.js` بساعة القاهرة وعداد الوردية
- [x] استبدال صفحة التشخيص المؤقتة بـ `index.html` الجديدة و`app.js`، وحذف `boot.js`
- [x] صفحات: `home` (لوحة تحكم وتشخيص)، `_placeholder`، `_error`، `not-found`، `forbidden`
- [x] صفحة دليل التصميم `styleguide` بـ 14 قسماً تفاعلياً ولوحة فحص ذاتي آلية
- [x] سكريبت الفحص `audit-renderer.mjs` وقواعد الفحص الـ 14 و0 أخطاء
- [x] حزمة اختبارات الـ UI (27 اختباراً ناجحاً في `tests/renderer/`):
  - `format.test.mjs`
  - `api.test.mjs`
  - `shortcuts.test.mjs`
  - `numpad.test.mjs`
  - `table.test.mjs`
  - `router.test.mjs`

### نتائج التحقق الحالية
| الأمر | النتيجة |
|-------|---------|
| `npm run check:native` | ✅ native OK |
| `npm run test:db` | ✅ 24 passed (0 failures) |
| `npm run test:ui` | ✅ 27 passed (0 failures) |
| `npm run audit:ui` | ✅ Audit PASSED (0 errors) |
| `npm run check:ui` | ✅ All UI audits and tests passed |
| `npm run selftest` | ✅ exit 0, ok:true, DB healthy & seeded |
| `npm run db:reset` | ✅ DB reset & seeded |
| `npm run db:migrate` | ✅ Migrations OK |

---

## 11. ما يأتي في الأجزاء القادمة

| الجزء | المحتوى |
|-------|---------|
| 4 | تسجيل الدخول + المستخدمين + الصلاحيات + الإعدادات |
| 5 | المنيو وإدارة الأصناف والأقسام والمعدلات |
| 6 | شاشة الكاشير وإدارة الطلبات والخصومات |
| 7 | الدفع وحركات النقدية والورديات |
| 8 | شاشة المطبخ وإدارة الترابيزات والتوصيل (الدليفري) |
| 9 | الطباعة وقوالب الفواتير والباركود |
| 10 | المخزون والمشتريات والمصروفات والتقارير والنسخ الاحتياطي |

---

## 12. ملاحظات بيئة التطوير

```
Node.js (host):   v24.13.1
Node.js (Electron bundled): v24.22.2
Electron:         45.3.1
SQLite:           3.54.1
OS:               Windows 10 x64
Shell:            PowerShell 5 (استخدم npm.cmd لا npm)
```

**مشكلة ELECTRON_RUN_AS_NODE**: بيئة Antigravity IDE تضبط هذا المتغير تلقائيًا.  
الحل: `$env:ELECTRON_RUN_AS_NODE="";` قبل أي أمر يستدعي Electron مباشرةً.


---

## 13. قواعد الواجهة ونظام التصميم (UI Rules)

1. **حظر كامل لـ innerHTML**: غير مسموح بـ `innerHTML` أو `outerHTML` أو `insertAdjacentHTML` في أي مكان في `src/renderer/`، باستثناء استخدام `DOMParser` المعتمد داخل الراوتر لقراءة القوالب الثابتة المحلية.
2. **العزل عن الستايل الداخلي**: ممنوع استخدام سمة `style=""` داخل عناصر HTML، وتعديل المتغيرات يتم حصرًا عبر `element.style.setProperty('--var', value)`.
3. **ألوان العقد الـ 11**: جميع الألوان تُعرَّف حصرًا داخل `src/renderer/styles/tokens.css` ويحظر كتابة قيم Hex أو RGB في أي ملف CSS آخر.
4. **دعم RTL وخصائص Logical**: استخدام الخصائص المنطقية (`padding-inline`, `margin-block`, `inset-inline-start`, ...) بشكل كامل، وحظر `left`/`right`/`margin-left`/`margin-right` إلا بتعليق استثنائي موثق `/* allow-physical */`.
5. **اللغة العربية في مكانها المحدد**: جميع النصوص العربية تتركز في `src/renderer/i18n/ar.js` (أو بيانات العرض في `sample-data.js`)، والكود والتعليقات والرسائل البرمجية بالإنجليزية.
6. **أهداف اللمس**: جميع العناصر التفاعلية (أزرار، حقول، مدخلات، خيارات) يجب ألا يقل ارتفاعها/مساحتها عن 48 بكسل (`--tap-min`) لضمان سهولة الاستخدام على شاشات اللمس.
7. **الحسابات المالية**: المعاملات المالية صحيحة دائمًا بالقروش (integers) وبدون استخدام Float Arithmetic.
8. **استقلالية الاختصارات**: اختصارات لوحة المفاتيح تعتمد على `event.code` للحروف والأرقام لتعمل بشكل متطابق سواء كانت لغة الإدخال عربية أو إنجليزية.
