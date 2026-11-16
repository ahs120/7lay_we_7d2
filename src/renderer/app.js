// src/renderer/app.js
// Main renderer entry point and boot coordinator.

import { qs } from './utils/dom.js';
import { call, safeCall } from './services/api.js';
import { configureFormat } from './utils/format.js';
import { shortcuts } from './services/shortcuts.js';
import { createShell } from './components/layout/shell.js';
import { router } from './router.js';
import { t } from './i18n/t.js';

const BOOT_START = Date.now();
const MIN_SPLASH_MS = 500;

function updateSplash(percent, message) {
  const bar = qs('.splash__progress-bar');
  const msgEl = qs('.splash__message');
  if (bar) bar.style.setProperty('inline-size', `${percent}%`);
  if (msgEl && message) msgEl.textContent = message;
}

function showBootError(err) {
  const splash = qs('#splash');
  if (splash) splash.classList.add('splash--error');
  const errBox = qs('.splash__error-box');
  const errMsg = qs('.splash__error-msg');
  if (errMsg) errMsg.textContent = err.message || t('errors.UNKNOWN');
  if (errBox) errBox.style.setProperty('display', 'block');

  const retryBtn = qs('.splash__retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      window.location.reload();
    }, { once: true });
  }
}

async function boot() {
  try {
    updateSplash(20, t('boot.checking_api'));

    // 1. Verify window.api and fetch app info
    const info = await call('app:info');
    const versionEl = qs('.splash__version');
    if (versionEl && info.version) {
      versionEl.textContent = `v${info.version}`;
    }

    updateSplash(50, t('boot.loading_fonts'));

    // 2. Wait for fonts
    if (document.fonts && typeof document.fonts.ready === 'object') {
      try { await document.fonts.ready; } catch { /* ignore font errors */ }
    }

    updateSplash(70, t('boot.loading_app'));

    // 3. Configure formatters
    configureFormat({
      locale: 'ar-EG'
    });

    // 4. Start global keyboard shortcuts
    shortcuts.start();

    // 5. Mount App Shell
    const appRoot = qs('#app-root');
    if (!appRoot) throw new Error('#app-root container element missing');

    const shell = createShell();
    appRoot.appendChild(shell.el);

    updateSplash(90, t('boot.almost_ready'));

    // 6. Start Router
    router.start(shell.viewportEl, { isDev: Boolean(info.dev) });

    updateSplash(100, t('app.ready'));

    // 7. Enforce minimum splash display duration
    const elapsed = Date.now() - BOOT_START;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    if (remaining > 0) {
      await new Promise(r => setTimeout(r, remaining));
    }

    // 8. Fade out and hide splash
    const splash = qs('#splash');
    if (splash) {
      splash.classList.add('splash--fade-out');
      setTimeout(() => {
        splash.classList.add('splash--hidden');
      }, 300);
    }

  } catch (err) {
    console.error('Fatal boot error:', err);
    showBootError(err);
  }
}

// Start boot sequence when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
