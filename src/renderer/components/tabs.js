// src/renderer/components/tabs.js
// WAI-ARIA Accessible Tabs component with roving tabindex and RTL-aware keyboard arrows.

import { h, uid, clear } from '../utils/dom.js';
import { icon } from './icon.js';

/**
 * @typedef {object} TabItem
 * @property {string} id
 * @property {string} label
 * @property {string} [icon]
 * @property {string|number} [badge]
 * @property {Node|string} [content]
 */

/**
 * @typedef {object} TabsOpts
 * @property {TabItem[]} items
 * @property {string} [activeId]
 * @property {(id: string) => void} [onChange]
 * @property {string} [className]
 */

export function tabs(opts = {}) {
  const {
    items = [],
    activeId: initialActiveId = items[0]?.id || '',
    onChange = null,
    className = ''
  } = opts;

  let currentId = initialActiveId;
  const baseId = uid('tabs');

  const wrapperClasses = ['tabs-container'];
  if (className) wrapperClasses.push(className);
  const wrapper = h('div', { class: wrapperClasses.join(' ') });

  const tablist = h('div', {
    class: 'tabs-list',
    role: 'tablist',
    'aria-orientation': 'horizontal'
  });
  wrapper.appendChild(tablist);

  const panelsWrap = h('div', { class: 'tabs-panels' });
  wrapper.appendChild(panelsWrap);

  const tabButtons = new Map();
  const panelElements = new Map();

  function renderTabs() {
    clear(tablist);
    clear(panelsWrap);
    tabButtons.clear();
    panelElements.clear();

    items.forEach((item, idx) => {
      const isSelected = item.id === currentId;
      const tabId = `${baseId}-tab-${item.id}`;
      const panelId = `${baseId}-panel-${item.id}`;

      // Tab button
      const btnClasses = ['tab-button'];
      if (isSelected) btnClasses.push('tab-button--active');

      const btn = h('button', {
        id: tabId,
        type: 'button',
        class: btnClasses.join(' '),
        role: 'tab',
        'aria-selected': isSelected ? 'true' : 'false',
        'aria-controls': panelId,
        tabindex: isSelected ? '0' : '-1'
      });

      if (item.icon) {
        btn.appendChild(icon(item.icon, { size: '1.25rem', className: 'tab-button__icon' }));
      }

      btn.appendChild(h('span', { class: 'tab-button__label' }, item.label));

      if (item.badge !== undefined && item.badge !== null) {
        btn.appendChild(h('span', { class: 'tab-button__badge num' }, String(item.badge)));
      }

      btn.addEventListener('click', () => setActive(item.id));
      tablist.appendChild(btn);
      tabButtons.set(item.id, btn);

      // Panel
      const panel = h('div', {
        id: panelId,
        class: 'tab-panel',
        role: 'tabpanel',
        'aria-labelledby': tabId,
        tabindex: '0'
      });
      if (!isSelected) {
        panel.setAttribute('hidden', '');
      }

      if (item.content) {
        if (typeof item.content === 'string') {
          panel.appendChild(document.createTextNode(item.content));
        } else if (item.content instanceof Node) {
          panel.appendChild(item.content);
        }
      }

      panelsWrap.appendChild(panel);
      panelElements.set(item.id, panel);
    });
  }

  function setActive(id) {
    if (currentId === id) return;
    currentId = id;

    items.forEach(item => {
      const btn = tabButtons.get(item.id);
      const panel = panelElements.get(item.id);
      const isSelected = item.id === id;

      if (btn) {
        btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        btn.setAttribute('tabindex', isSelected ? '0' : '-1');
        btn.classList.toggle('tab-button--active', isSelected);
        if (isSelected) {
          btn.focus();
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      }

      if (panel) {
        if (isSelected) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      }
    });

    if (onChange) onChange(id);
  }

  // Keyboard navigation on tablist
  tablist.addEventListener('keydown', (e) => {
    const activeIndex = items.findIndex(item => item.id === currentId);
    if (activeIndex === -1) return;

    let nextIndex = activeIndex;

    // RTL awareness:
    // In RTL, ArrowLeft moves forward (next tab), ArrowRight moves backward (prev tab)!
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (activeIndex + 1) % items.length;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (activeIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = items.length - 1;
    }

    if (nextIndex !== activeIndex) {
      setActive(items[nextIndex].id);
    }
  });

  renderTabs();

  return {
    el: wrapper,
    setActive,
    getActiveId() {
      return currentId;
    },
    destroy() {
      // Elements and listeners garbage collected
    }
  };
}
