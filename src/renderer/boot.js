// src/renderer/boot.js
// Diagnostic boot script. No innerHTML, no inline styles, no onclick.
// Replaced by the real app shell in the UI part.

/** Append a text node to an element. */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/** Append a dt/dd pair to a dl element. */
function appendDl(dlEl, term, detail, ltrDetail = false) {
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  if (ltrDetail) dd.dir = 'ltr';
  dd.textContent = detail;
  dlEl.appendChild(dt);
  dlEl.appendChild(dd);
}

/** Append a line to the event log. */
function logEvent(message) {
  const pre = document.getElementById('event-log');
  if (!pre) return;
  const line = document.createTextNode(`[${new Date().toISOString()}] ${message}\n`);
  pre.appendChild(line);
}

// ── Self-checks ──────────────────────────────────────────────────────────────

function runSelfChecks(checksDl) {
  const checks = [];

  // Check 1: Isolation — window.api must exist and have no extra keys
  try {
    if (typeof window.api === 'undefined') throw new Error('window.api is undefined');
    if (typeof window.api.invoke !== 'function') throw new Error('window.api.invoke is not a function');
    if (typeof window.api.on !== 'function') throw new Error('window.api.on is not a function');
    // Confirm contextIsolation: Node.js globals must NOT be accessible
    if (typeof window.require !== 'undefined') throw new Error('window.require is exposed (bad isolation!)');
    checks.push({ name: 'عزل الـ Context', pass: true });
  } catch (err) {
    checks.push({ name: 'عزل الـ Context', pass: false, detail: err.message });
  }

  // Check 2: Whitelist — unknown channel must be rejected without throwing
  try {
    // This should NOT throw; it returns { ok: false, code: 'UNKNOWN_CHANNEL' }
    // We test synchronously by calling with an unknown channel and checking the returned promise
    // (we can't await here, so we schedule it)
    window.api.invoke('app:__nonexistent__').then(res => {
      const pass = res.ok === false && (res.code === 'UNKNOWN_CHANNEL' || res.code === 'BAD_CHANNEL');
      checks.push({ name: 'Whitelist المجهول', pass, detail: JSON.stringify(res) });
      renderChecks(checksDl, checks);
    });
    // Add placeholder
    checks.push({ name: 'Whitelist المجهول', pass: null, detail: 'جاري الفحص...' });
  } catch (err) {
    checks.push({ name: 'Whitelist المجهول', pass: false, detail: err.message });
  }

  // Check 3: Event subscription — app:fullscreenChanged must be subscribable
  try {
    const unsub = window.api.on('app:fullscreenChanged', (payload) => {
      logEvent('app:fullscreenChanged → ' + JSON.stringify(payload));
    });
    if (typeof unsub !== 'function') throw new Error('on() did not return unsubscribe function');
    checks.push({ name: 'اشتراك الأحداث', pass: true });
    logEvent('تم الاشتراك في app:fullscreenChanged (اضغط F11 للاختبار)');
  } catch (err) {
    checks.push({ name: 'اشتراك الأحداث', pass: false, detail: err.message });
  }

  renderChecks(checksDl, checks);
  return checks;
}

function renderChecks(dlEl, checks) {
  dlEl.textContent = ''; // clear
  for (const c of checks) {
    const mark = c.pass === true ? '✅ PASS' : c.pass === false ? '❌ FAIL' : '⏳ ...';
    appendDl(dlEl, c.name, `${mark}${c.detail ? ' — ' + c.detail : ''}`, true);
  }
}

// ── Main boot ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.api === 'undefined') {
    setText('status', '❌ window.api غير موجود — مشكلة في الـ preload');
    return;
  }

  setText('status', '⏳ جاري الاتصال...');

  // Self-checks (synchronous portion)
  const checksDl = document.getElementById('checks-list');
  runSelfChecks(checksDl);

  // Ping
  try {
    const pingRes = await window.api.invoke('app:ping', { message: 'مرحبا' });
    if (pingRes.ok) {
      setText('status', '✅ متصل — ping OK');
      logEvent('ping: ' + JSON.stringify(pingRes.data));
    } else {
      setText('status', '❌ ping فشل: ' + pingRes.message);
    }
  } catch (err) {
    setText('status', '❌ خطأ: ' + err.message);
  }

  // App info
  try {
    const infoRes = await window.api.invoke('app:info');
    if (infoRes.ok) {
      const info = infoRes.data;
      const appInfoDl = document.getElementById('app-info');
      appendDl(appInfoDl, 'الإصدار', info.version);
      appendDl(appInfoDl, 'Electron', info.electron, true);
      appendDl(appInfoDl, 'Node.js', info.node, true);
      appendDl(appInfoDl, 'المنصة', info.platform, true);
      appendDl(appInfoDl, 'SQLite', info.sqlite?.ok ? '✅ OK' : '❌ ' + info.sqlite?.error);
      appendDl(appInfoDl, 'userData', info.userData, true);
      appendDl(appInfoDl, 'ملف السجل', info.logFile, true);
      appendDl(appInfoDl, 'وضع التطوير', info.dev ? 'نعم' : 'لا');
      logEvent('app:info received');
    }
  } catch (err) {
    logEvent('app:info error: ' + err.message);
  }

  // DB Health
  try {
    const dbRes = await window.api.invoke('db:health');
    if (dbRes.ok && dbRes.data?.ok) {
      const h = dbRes.data;
      const appInfoDl = document.getElementById('app-info');
      appendDl(appInfoDl, 'إصدار الـ Schema', `${h.schemaVersion} (Latest: ${h.latestVersion})`, true);
      appendDl(appInfoDl, 'وضع الـ Journal', h.journalMode, true);
      appendDl(appInfoDl, 'الـ Foreign Keys', h.foreignKeys ? '✅ ON' : '❌ OFF', true);
      appendDl(appInfoDl, 'سلامة البيانات', h.integrity === 'ok' ? '✅ OK' : '❌ ' + h.integrity);
      appendDl(appInfoDl, 'حالة الـ Seed', h.seeded ? '✅ نعم' : '❌ لا');
      logEvent('db:health received: ' + JSON.stringify(h));
    } else {
      logEvent('db:health failed: ' + (dbRes.data?.error || dbRes.message));
    }
  } catch (err) {
    logEvent('db:health error: ' + err.message);
  }
});

