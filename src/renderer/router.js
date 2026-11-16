// src/renderer/router.js
// Hash-based SPA Router with DOMParser template loading, lifecycle scopes, and guards.

import { clear } from './utils/dom.js';
import { createScope } from './utils/scope.js';
import { parseHash, buildHash, normalizePath, matchRoute } from './router.logic.js';
import { ROUTES } from './routes.js';
import { can as canAccess } from './state/session.js';
import { t } from './i18n/t.js';

class Router {
  constructor() {
    this.routes = ROUTES;
    this.container = null;
    this.currentRoute = null;
    this.currentContext = null;
    this.activeScope = null;
    this.activePageInstance = null;
    this.navToken = 0;
    this.started = false;
    this.isDev = false;

    this._onHashChange = this._onHashChange.bind(this);
  }

  /**
   * Initialize router with container DOM element.
   * @param {HTMLElement} container
   * @param {{ isDev?: boolean }} [opts]
   */
  start(container, opts = {}) {
    if (this.started) return;
    this.container = container;
    this.isDev = Boolean(opts.isDev);
    this.started = true;

    window.addEventListener('hashchange', this._onHashChange);
    this._handleNavigation();
  }

  stop() {
    if (!this.started) return;
    window.removeEventListener('hashchange', this._onHashChange);
    this._destroyActivePage();
    this.started = false;
  }

  /**
   * Navigate to a path with optional query parameters.
   * @param {string} path
   * @param {Record<string, any>} [query]
   */
  navigate(path, query = null) {
    const targetHash = buildHash(path, query);
    if (window.location.hash === targetHash) {
      this._handleNavigation(); // Force reload if same hash
    } else {
      window.location.hash = targetHash;
    }
  }

  /**
   * Replace current route without pushing history entry.
   * @param {string} path
   * @param {Record<string, any>} [query]
   */
  replace(path, query = null) {
    const targetHash = buildHash(path, query);
    const url = new URL(window.location.href);
    url.hash = targetHash;
    window.location.replace(url.href);
    this._handleNavigation();
  }

  back() {
    window.history.back();
  }

  current() {
    return this.currentContext;
  }

  async _onHashChange() {
    await this._handleNavigation();
  }

  async _handleNavigation() {
    const token = ++this.navToken;
    const { path, query } = parseHash(window.location.hash);

    // canLeave check on current active page
    if (this.activePageInstance && typeof this.activePageInstance.canLeave === 'function') {
      const allowed = await this.activePageInstance.canLeave();
      if (!allowed) {
        // Revert hash without triggering navigation
        if (this.currentContext) {
          const prevHash = buildHash(this.currentContext.path, this.currentContext.query);
          window.removeEventListener('hashchange', this._onHashChange);
          window.location.hash = prevHash;
          window.addEventListener('hashchange', this._onHashChange);
        }
        return;
      }
    }

    let route = matchRoute(this.routes, path);

    // DevOnly check
    if (route && route.devOnly && !this.isDev) {
      route = null;
    }

    // Permission check
    if (route && route.permission && !canAccess(route.permission)) {
      this.replace('/forbidden');
      return;
    }

    // Fallback to 404
    if (!route) {
      route = matchRoute(this.routes, '/not-found') || {
        path: '/not-found',
        page: 'not-found',
        titleKey: 'notFound.title'
      };
    }

    await this._loadPage(route, path, query, token);
  }

  async _loadPage(route, path, query, token) {
    try {
      // 1. Fetch template HTML (trusted local static file)
      const pageName = route.page;
      const htmlUrl = `/pages/${pageName}/${pageName}.html`;
      const jsUrl = `/pages/${pageName}/${pageName}.js`;

      const res = await fetch(htmlUrl);
      if (!res.ok) throw new Error(`Failed to load template: ${htmlUrl} (${res.status})`);
      const htmlText = await res.text();

      // Check race condition
      if (token !== this.navToken) return;

      // 2. Parse HTML safely with DOMParser (contract exception for trusted local static pages)
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // 3. Dynamically import page JS module
      const pageModule = await import(jsUrl);

      // Check race condition again
      if (token !== this.navToken) return;

      // 4. Teardown active page and its scope
      this._destroyActivePage();

      // 5. Mount template elements into container
      clear(this.container);
      const fragment = document.createDocumentFragment();
      while (doc.body.firstChild) {
        fragment.appendChild(doc.body.firstChild);
      }
      this.container.appendChild(fragment);

      // 6. Create clean lifecycle scope for new page
      const scope = createScope();
      this.activeScope = scope;

      this.currentRoute = route;
      this.currentContext = {
        path,
        query,
        route,
        scope,
        router: this
      };

      // 7. Initialize page module
      if (typeof pageModule.init === 'function') {
        const instance = await pageModule.init(this.container, this.currentContext);
        if (token !== this.navToken) {
          // Navigated away during init
          if (instance && typeof instance.destroy === 'function') instance.destroy();
          return;
        }
        this.activePageInstance = instance;
      }

      // Notify route change
      window.dispatchEvent(new CustomEvent('app:route-changed', {
        detail: this.currentContext
      }));

    } catch (err) {
      if (token !== this.navToken) return;
      console.error(`Router error loading route "${path}":`, err);
      this._renderError(err);
    }
  }

  _destroyActivePage() {
    if (this.activePageInstance && typeof this.activePageInstance.destroy === 'function') {
      try { this.activePageInstance.destroy(); } catch (e) { console.error('Page destroy error:', e); }
    }
    this.activePageInstance = null;

    if (this.activeScope) {
      this.activeScope.dispose();
      this.activeScope = null;
    }
  }

  _renderError(err) {
    clear(this.container);
    const errBox = document.createElement('div');
    errBox.setAttribute('class', 'page-error');
    errBox.textContent = `${t('router.load_error')}: ${err.message}`;
    this.container.appendChild(errBox);
  }
}

export const router = new Router();
