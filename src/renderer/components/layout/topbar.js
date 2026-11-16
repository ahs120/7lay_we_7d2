// src/renderer/components/layout/topbar.js
// App TopBar with live Cairo clock, shift status with timer, printer health, page actions, and user badge.

import { h, clear } from '../../utils/dom.js';
import { icon } from '../icon.js';
import { statusStore } from '../../state/status.js';
import { currentUser } from '../../state/session.js';
import { formatTime, cairoNow, formatDuration } from '../../utils/format.js';
import { t } from '../../i18n/t.js';

export function createTopBar() {
  const topbarEl = h('header', { class: 'app-topbar', role: 'banner' });

  // ── Left: Page Title & Action Slot ──────────────────────────────────────────
  const startEl = h('div', { class: 'topbar-start' });
  const titleEl = h('h1', { class: 'topbar-title' }, t('nav.home'));
  const actionsEl = h('div', { class: 'topbar-actions' });

  startEl.appendChild(titleEl);
  startEl.appendChild(actionsEl);
  topbarEl.appendChild(startEl);

  // ── Right: Indicators & Profile ─────────────────────────────────────────────
  const endEl = h('div', { class: 'topbar-end' });

  // 1. Shift indicator
  const shiftBadge = h('div', { class: 'topbar-indicator topbar-shift' });
  const shiftIcon = icon('clock', { size: '1.125rem' });
  const shiftText = h('span', { class: 'topbar-shift__text' });
  shiftBadge.appendChild(shiftIcon);
  shiftBadge.appendChild(shiftText);
  endEl.appendChild(shiftBadge);

  // 2. Printer indicator
  const printerBadge = h('div', { class: 'topbar-indicator topbar-printer' });
  const printerDot = h('span', { class: 'printer-dot' });
  const printerIcon = icon('printer', { size: '1.125rem' });
  const printerText = h('span', { class: 'topbar-printer__text' });
  printerBadge.appendChild(printerDot);
  printerBadge.appendChild(printerIcon);
  printerBadge.appendChild(printerText);
  endEl.appendChild(printerBadge);

  // 3. Live Cairo Clock
  const clockEl = h('div', { class: 'topbar-clock num ltr' });
  endEl.appendChild(clockEl);

  // 4. User profile pill
  const userPill = h('div', { class: 'topbar-user' });
  const userAvatar = icon('user', { size: '1.25rem', className: 'topbar-user__icon' });
  const userName = h('span', { class: 'topbar-user__name' }, currentUser()?.name || '');
  userPill.appendChild(userAvatar);
  userPill.appendChild(userName);
  endEl.appendChild(userPill);

  topbarEl.appendChild(endEl);

  // ── State Subscriptions & Timers ───────────────────────────────────────────
  function updateClock() {
    clockEl.textContent = formatTime(cairoNow());
  }

  function updateShift() {
    const { shift } = statusStore.get();
    if (shift && shift.open && shift.openedAt) {
      const opened = new Date(shift.openedAt).getTime();
      const elapsedSec = Math.floor((Date.now() - opened) / 1000);
      shiftText.textContent = `${t('shell.shift.open')} (${formatDuration(elapsedSec)})`;
      shiftBadge.classList.add('topbar-shift--open');
      shiftBadge.classList.remove('topbar-shift--closed');
    } else {
      shiftText.textContent = t('shell.shift.closed');
      shiftBadge.classList.remove('topbar-shift--open');
      shiftBadge.classList.add('topbar-shift--closed');
    }
  }

  function updatePrinter() {
    const { printer } = statusStore.get();
    const st = printer?.status || 'offline';
    printerBadge.className = `topbar-indicator topbar-printer topbar-printer--${st}`;
    printerText.textContent = st === 'ok' ? t('shell.printer.ok') : st === 'error' ? t('shell.printer.error') : t('shell.printer.offline');
  }

  updateClock();
  updateShift();
  updatePrinter();

  const clockInterval = setInterval(() => {
    updateClock();
    updateShift();
  }, 1000);

  const unsubStatus = statusStore.subscribe(() => {
    updateShift();
    updatePrinter();
  });

  return {
    el: topbarEl,
    setTitle(text) {
      titleEl.textContent = text;
    },
    setActions(actionNodes) {
      clear(actionsEl);
      if (Array.isArray(actionNodes)) {
        actionNodes.forEach(n => { if (n) actionsEl.appendChild(n); });
      } else if (actionNodes instanceof Node) {
        actionsEl.appendChild(actionNodes);
      }
    },
    destroy() {
      clearInterval(clockInterval);
      unsubStatus();
    }
  };
}
