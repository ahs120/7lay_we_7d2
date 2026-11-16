// src/renderer/components/layout/shell.js
// Main application layout shell holding Sidebar, TopBar, and scrollable page viewport.

import { h } from '../../utils/dom.js';
import { createSidebar } from './sidebar.js';
import { createTopBar } from './topbar.js';
import { router } from '../../router.js';
import { t } from '../../i18n/t.js';

export function createShell() {
  const rootEl = h('div', { class: 'app-shell' });

  // Sidebar
  const sidebar = createSidebar({
    onNavigate: (path) => {
      router.navigate(path);
    }
  });

  // Main area
  const mainArea = h('div', { class: 'app-main' });

  // TopBar
  const topbar = createTopBar();
  mainArea.appendChild(topbar.el);

  // Scrollable page viewport
  const viewport = h('main', {
    id: 'page-viewport',
    class: 'app-viewport',
    tabindex: '-1'
  });
  mainArea.appendChild(viewport);

  // In RTL, sidebar is visually on the right
  rootEl.appendChild(sidebar.el);
  rootEl.appendChild(mainArea);

  // Sync route changes to sidebar & topbar
  function handleRouteChanged(e) {
    const { path, route } = e.detail;
    sidebar.setActivePath(path);
    topbar.setTitle(route?.titleKey ? t(route.titleKey) : '');
    topbar.setActions([]); // Reset action buttons on route switch
  }

  window.addEventListener('app:route-changed', handleRouteChanged);

  return {
    el: rootEl,
    viewportEl: viewport,
    topbar,
    sidebar,
    destroy() {
      window.removeEventListener('app:route-changed', handleRouteChanged);
      topbar.destroy();
      sidebar.destroy();
    }
  };
}
