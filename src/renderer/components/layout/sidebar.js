// src/renderer/components/layout/sidebar.js
// App Sidebar with brand logo, monogram fallback, permission-filtered nav, and compact toggle.

import { h, clear } from '../../utils/dom.js';
import { icon } from '../icon.js';
import { ROUTES } from '../../routes.js';
import { can } from '../../state/session.js';
import { t } from '../../i18n/t.js';
import { APP_NAME_AR } from '../../../shared/constants.js';

export function createSidebar(opts = {}) {
  const { onNavigate = null } = opts;

  let isCompact = localStorage.getItem('ui.sidebar') === 'compact';
  let activePath = '/';

  const sidebarEl = h('aside', {
    class: `app-sidebar ${isCompact ? 'app-sidebar--compact' : ''}`,
    'aria-label': t('nav.menu_label')
  });

  // ── Header / Brand ──────────────────────────────────────────────────────────
  const brandEl = h('div', { class: 'sidebar-brand' });

  // Logo with fallback
  const logoImg = h('img', {
    src: '/assets/logo.png',
    alt: APP_NAME_AR,
    class: 'sidebar-brand__logo'
  });

  const monogram = h('div', { class: 'sidebar-brand__monogram', 'aria-hidden': 'true' }, t('app.monogram'));
  monogram.style.setProperty('display', 'none');

  logoImg.addEventListener('error', () => {
    logoImg.style.setProperty('display', 'none');
    monogram.style.setProperty('display', 'flex');
  });

  brandEl.appendChild(logoImg);
  brandEl.appendChild(monogram);

  const brandText = h('div', { class: 'sidebar-brand__text' });
  brandText.appendChild(h('div', { class: 'sidebar-brand__title' }, APP_NAME_AR));
  brandEl.appendChild(brandText);

  sidebarEl.appendChild(brandEl);

  // ── Navigation List ─────────────────────────────────────────────────────────
  const navEl = h('nav', { class: 'sidebar-nav' });
  const navList = h('ul', { class: 'sidebar-nav__list' });
  navEl.appendChild(navList);
  sidebarEl.appendChild(navEl);

  function renderNav() {
    clear(navList);

    const visibleRoutes = ROUTES.filter(r => {
      if (r.path === '/not-found' || r.path === '/forbidden') return false;
      if (r.permission && !can(r.permission)) return false;
      return true;
    });

    visibleRoutes.forEach(route => {
      const isCurrent = activePath === route.path || (route.path !== '/' && activePath.startsWith(route.path));
      const li = h('li', { class: 'sidebar-nav__item' });

      const linkClasses = ['sidebar-nav__link'];
      if (isCurrent) linkClasses.push('sidebar-nav__link--active');

      const title = t(route.titleKey);
      const linkProps = {
        href: `#${route.path}`,
        class: linkClasses.join(' '),
        'data-path': route.path,
        title: isCompact ? title : ''
      };
      if (isCurrent) linkProps['aria-current'] = 'page';

      const a = h('a', linkProps);
      a.appendChild(icon(route.icon || 'circle-slash', {
        className: 'sidebar-nav__icon',
        size: '1.5rem'
      }));

      const label = h('span', { class: 'sidebar-nav__label' }, title);
      a.appendChild(label);

      a.addEventListener('click', (e) => {
        if (onNavigate) {
          e.preventDefault();
          onNavigate(route.path);
        }
      });

      li.appendChild(a);
      navList.appendChild(li);
    });
  }

  // ── Toggle Footer ───────────────────────────────────────────────────────────
  const footerEl = h('div', { class: 'sidebar-footer' });
  const toggleBtn = h('button', {
    type: 'button',
    class: 'sidebar-toggle-btn',
    'aria-label': isCompact ? t('nav.expand') : t('nav.collapse')
  });

  const toggleIcon = icon('panel-left', { size: '1.25rem', className: 'sidebar-toggle-btn__icon' });
  const toggleLabel = h('span', { class: 'sidebar-toggle-btn__label' }, isCompact ? t('nav.expand') : t('nav.collapse'));

  toggleBtn.appendChild(toggleIcon);
  toggleBtn.appendChild(toggleLabel);

  function setCompact(compact) {
    isCompact = compact;
    localStorage.setItem('ui.sidebar', isCompact ? 'compact' : 'expanded');
    sidebarEl.classList.toggle('app-sidebar--compact', isCompact);
    toggleBtn.setAttribute('aria-label', isCompact ? t('nav.expand') : t('nav.collapse'));
    toggleLabel.textContent = isCompact ? t('nav.expand') : t('nav.collapse');
    renderNav();
  }

  toggleBtn.addEventListener('click', () => {
    setCompact(!isCompact);
  });

  footerEl.appendChild(toggleBtn);
  sidebarEl.appendChild(footerEl);

  // Responsive check
  function checkWidth() {
    if (window.innerWidth < 1500 && !isCompact) {
      setCompact(true);
    }
  }

  window.addEventListener('resize', checkWidth);

  // Initial render
  renderNav();
  checkWidth();

  return {
    el: sidebarEl,
    setActivePath(p) {
      activePath = p;
      renderNav();
    },
    setCompact,
    destroy() {
      window.removeEventListener('resize', checkWidth);
    }
  };
}
