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
**ممنوع خارج `src/main/db/repositories/`** — حتى في الاختبارات والسكريبتات الداخلية.  
`scripts/check-sqlite.cjs` استثناء واحد (خارج src) ومسموح به.

### 3.9 الأرقام المالية
- كل القيم بـ **piasters** (integers) — مثال: 1500 = 15.00 ج.م
- الضريبة والخدمة بـ **basis points** — مثال: 1400 = 14%
- تقريب half-up — لا float arithmetic
- المنطق في `src/shared/pricing.js`

### 3.10 التواريخ
- مخزّنة كـ **ISO UTC strings** في SQLite
- عرضها بتوقيت `Africa/Cairo` في الـ UI

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
```

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

## 10. ما تم في الجزء 1

### ✅ منجز
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

### نتائج التحقق
| الأمر | النتيجة |
|-------|---------|
| `npm run check:native` | ✅ native OK |
| `npm run selftest` | ✅ exit 0، ok:true |
| `npm start` | ✅ نافذة تفتح |
| `npm run dist` | ✅ installer مبني |

---

## 11. ما يأتي في الأجزاء القادمة

| الجزء | المحتوى |
|-------|---------|
| 2 | DB schema + migrations + repositories |
| 3 | تسجيل الدخول + المستخدمين + الإعدادات |
| 4 | المنيو |
| 5 | شاشة الكاشير والأوردرات |
| 6 | الدفع والورديات |
| 7 | المطبخ والترابيزات والدليفري |
| 8 | الطباعة |
| 9 | المخزون والمشتريات والمصروفات |
| 10 | التقارير والباك أب |
| UI | نظام التصميم + الراوتر + الشاشة الرئيسية (بعد الجزء 3) |

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
