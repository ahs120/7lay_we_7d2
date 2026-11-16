// src/renderer/pages/home/home.js
// Home dashboard page with diagnostic indicators and navigation shortcuts.

import { h, qs } from '../../utils/dom.js';
import { card } from '../../components/card.js';
import { badge } from '../../components/badge.js';
import { icon } from '../../components/icon.js';
import { safeCall } from '../../services/api.js';
import { currentUser } from '../../state/session.js';
import { t } from '../../i18n/t.js';

export async function init(container, ctx) {
  const { router } = ctx;

  const welcomeTitle = qs('#home-welcome-title', container);
  const user = currentUser();
  if (welcomeTitle && user) {
    welcomeTitle.textContent = t('home.welcome_user', { name: user.name });
  }

  // ── Navigation Shortcuts ────────────────────────────────────────────────────
  const shortcutsContainer = qs('#home-shortcuts', container);
  if (shortcutsContainer) {
    const tiles = [
      { path: '/cashier', label: t('home.go_cashier'), icon: 'shopping-cart', desc: t('home.desc_cashier') },
      { path: '/tables', label: t('home.go_tables'), icon: 'table-2', desc: t('home.desc_tables') },
      { path: '/kitchen', label: t('home.go_kitchen'), icon: 'chef-hat', desc: t('home.desc_kitchen') },
      { path: '/menu', label: t('home.go_menu'), icon: 'book-open', desc: t('home.desc_menu') },
      { path: '/reports', label: t('home.go_reports'), icon: 'chart-bar', desc: t('home.desc_reports') },
      { path: '/settings', label: t('home.go_settings'), icon: 'settings', desc: t('home.desc_settings') }
    ];

    if (router.isDev) {
      tiles.push({
        path: '/styleguide',
        label: t('styleguide.title'),
        icon: 'sliders-horizontal',
        desc: t('home.desc_styleguide')
      });
    }

    tiles.forEach(tile => {
      const tileEl = h(
        'button',
        {
          type: 'button',
          class: 'home-tile',
          'aria-label': tile.label
        },
        icon(tile.icon, { size: '2rem', className: 'home-tile__icon' }),
        h('span', { class: 'home-tile__title' }, tile.label),
        h('span', { class: 'home-tile__desc' }, tile.desc)
      );

      tileEl.addEventListener('click', () => {
        router.navigate(tile.path);
      });

      shortcutsContainer.appendChild(tileEl);
    });
  }

  // ── System Status & Diagnostics Cards ───────────────────────────────────────
  const cardsContainer = qs('#home-cards', container);
  if (cardsContainer) {
    // 1. App Info Card
    const infoRes = await safeCall('app:info');
    const info = infoRes.ok ? infoRes.data : {};

    const infoBody = h('dl', { class: 'home-diag-list' },
      h('dt', {}, t('home.version_label')),
      h('dd', { class: 'num ltr' }, String(info.version || '-')),
      h('dt', {}, t('home.electron_label')),
      h('dd', { class: 'num ltr' }, String(info.electron || '-')),
      h('dt', {}, 'Node.js'),
      h('dd', { class: 'num ltr' }, String(info.node || '-'))
    );

    const infoCard = card({
      header: h('div', { class: 'row' },
        icon('info', { size: '1.25rem' }),
        h('span', {}, t('home.system_info'))
      ),
      body: infoBody
    });
    cardsContainer.appendChild(infoCard);

    // 2. Database Health Card
    const dbRes = await safeCall('db:health');
    const db = dbRes.ok ? dbRes.data : {};

    const dbBody = h('dl', { class: 'home-diag-list' },
      h('dt', {}, t('home.schema_label')),
      h('dd', { class: 'num ltr' }, String(db.schemaVersion || '-')),
      h('dt', {}, 'Journal Mode'),
      h('dd', { class: 'num ltr' }, String(db.journalMode || '-')),
      h('dt', {}, 'Foreign Keys'),
      h('dd', {}, db.foreignKeys ? badge({ text: 'ON', variant: 'success', size: 'sm' }) : badge({ text: 'OFF', variant: 'danger', size: 'sm' })),
      h('dt', {}, t('home.demo_data')),
      h('dd', {}, db.seeded ? badge({ text: t('home.ready_status'), variant: 'success', size: 'sm' }) : badge({ text: t('home.empty_status'), variant: 'neutral', size: 'sm' }))
    );

    const dbCard = card({
      header: h('div', { class: 'row' },
        icon('box', { size: '1.25rem' }),
        h('span', {}, t('home.db_status'))
      ),
      body: dbBody
    });
    cardsContainer.appendChild(dbCard);

    // 3. Ping Test Card
    const t0 = Date.now();
    const pingRes = await safeCall('app:ping', { check: 'home' });
    const latency = Date.now() - t0;

    const pingBody = h('dl', { class: 'home-diag-list' },
      h('dt', {}, t('home.ipc_connection')),
      h('dd', {}, pingRes.ok ? badge({ text: t('home.connected'), variant: 'success', size: 'sm' }) : badge({ text: t('home.failed'), variant: 'danger', size: 'sm' })),
      h('dt', {}, t('home.latency')),
      h('dd', { class: 'num ltr' }, `${latency} ms`)
    );

    const pingCard = card({
      header: h('div', { class: 'row' },
        icon('zap', { size: '1.25rem' }),
        h('span', {}, t('home.connection_status'))
      ),
      body: pingBody
    });
    cardsContainer.appendChild(pingCard);
  }

  return {
    destroy() {}
  };
}
