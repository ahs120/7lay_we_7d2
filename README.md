# كاشير محمد فوزي — الجزء 1: الأساس

نظام كاشير سطح مكتب لمطعم محمد فوزي، مبني بـ Electron + Vanilla JS، يعمل بالكامل بدون إنترنت.

---

## متطلبات التشغيل

- Windows 10 أو 11 (x64)
- Node.js LTS (22 أو أحدث)
- Git

---

## تثبيت بيئة التطوير

```powershell
git clone <repo-url> abdelslam
cd abdelslam
npm install
```

> بعد `npm install` بيشتغل `postinstall` تلقائيًا ويفحص `better-sqlite3`.  
> لو ظهرت رسالة بناء من المصدر → ثبّت **Visual Studio Build Tools** (Desktop development with C++) ثم `npm run rebuild`.

---

## الأوامر

| الأمر | الوظيفة |
|-------|---------|
| `npm start` | تشغيل التطبيق (نافذة عادية) |
| `npm run dev` | تشغيل بـ DevTools مفتوحة + لوج debug |
| `npm run selftest` | فحص ذاتي headless — يكتب `selftest.json` ويخرج |
| `npm run check:native` | يتحقق أن `better-sqlite3` يعمل مع Electron |
| `npm run rebuild` | يعيد بناء `better-sqlite3` من المصدر (نادر) |
| `npm run icon` | يولّد `build/icon.ico` من `src/renderer/assets/logo.png` |
| `npm run dist` | يبني installer NSIS في `release/` |

---

## اللوجو

ضع ملف اللوجو في:

```
src/renderer/assets/logo.png
```

- مربع (العرض = الارتفاع)
- ≥ 512 × 512 بكسل
- PNG مع قناة شفافية (RGBA)

الملف الحالي **placeholder** بلون برتقالي (`#E8742C`). استبدله بلوجو المطعم الحقيقي ثم أعد تشغيل `npm run icon`.

---

## هيكل المشروع

```
src/
├── main/              ← Main process (Node.js / Electron)
│   ├── main.js        ← نقطة الدخول
│   ├── ipc/           ← معالجات IPC (auto-discovered)
│   │   └── app.js     ← app:ping, app:info
│   └── services/
│       ├── errors.js      ← AppError + toErrorPayload
│       ├── ipc.js         ← إطار IPC المركزي
│       ├── logger.js      ← electron-log wrapper
│       ├── native-check.js← فحص better-sqlite3
│       ├── protocol.js    ← بروتوكول app://local/
│       ├── runtime.js     ← isDev, isSelfTest, isPackaged
│       └── validate.js    ← validators (v.string, v.int, …)
├── preload/
│   ├── package.json   ← {"type":"commonjs"}
│   └── preload.js     ← window.api (invoke + on) — whitelist ديناميكية
├── renderer/          ← UI (Vanilla JS, لا Node APIs)
│   ├── index.html     ← صفحة تشخيص مؤقتة
│   ├── boot.js        ← منطق الصفحة
│   └── assets/
│       ├── logo.png   ← (placeholder حاليًا)
│       └── fonts/     ← خطوط Cairo + Aref Ruqaa (تُنسخ في أجزاء لاحقة)
└── shared/            ← مشترك بين main وrenderer
    ├── constants.js
    ├── permissions.js
    └── pricing.js

scripts/
├── check-sqlite.cjs       ← يُشغَّل داخل Electron لفحص N-API
├── ensure-native.mjs      ← postinstall + check:native
├── make-icon.mjs          ← يولّد icon.ico من logo.png
└── make-placeholder-logo.cjs ← (للتطوير فقط، احذفه بعد وضع اللوجو الحقيقي)

docs/
└── PROJECT_CONTEXT.md     ← عقد المشروع (Contract)

build/
└── icon.ico               ← مُولَّد تلقائيًا (لا تعدّله يدويًا)

release/                   ← installer الناتج (مُهمَل في git)
```

---

## البيانات والسجلات

| الوضع | مجلد البيانات |
|-------|--------------|
| تطوير (`npm run dev`) | `%APPDATA%\MohamedFawzyPOS-dev\` |
| إنتاج (`npm start`) | `%APPDATA%\MohamedFawzyPOS\` |

ملف السجل: `<userData>\logs\main.log`  
نتيجة selftest: `<userData>\logs\selftest.json`

---

## الأمان

- بروتوكول `app://local/` بدل `file://` — CSP صارمة بدون `unsafe-inline`
- `sandbox: true` + `contextIsolation: true` + `nodeIntegration: false`
- Whitelist ديناميكية للـ IPC — preload يسأل main عن القنوات المسجّلة فعلًا
- لا navigation لروابط خارجية، لا `window.open`
- لا صلاحيات (كاميرا/مايك/…) — مرفوضة كلها
- DevTools متاحة فقط في وضع التطوير (محجوبة في الـ installer)

---

## الـ Installer

```powershell
# تأكد من وجود logo.png الحقيقي أولًا، ثم:
npm run dist
```

الناتج: `release\MohamedFawzyPOS-Setup-0.1.0.exe`

- تثبيت per-user (لا يحتاج Admin)
- اختيار مجلد التثبيت
- اختصار على سطح المكتب وقائمة Start

---

## ملاحظات للمطوّر

- **الـ ELECTRON_RUN_AS_NODE**: بيئة Antigravity IDE بتضبط هذا المتغير — لازم تلغيه قبل أي أمر Electron:
  ```powershell
  $env:ELECTRON_RUN_AS_NODE=""; npm.cmd run dev
  ```
- **ESM في main**: استخدم `import electron from 'electron'; const { app } = electron;` وليس destructuring مباشر.
- **SQL**: ممنوع خارج `src/main/db/repositories/` — حتى لو كنت تختبر.
- **innerHTML**: ممنوع في أي ملف renderer — استخدم `textContent` و`createElement`.
- **style=""**: ممنوع في HTML (CSP تحجبه) — الكلاسات فقط.

