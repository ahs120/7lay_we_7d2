// src/renderer/components/empty-state.js
// Empty state illustration and message for empty views/lists.

import { h } from '../utils/dom.js';
import { icon } from './icon.js';
import { button } from './button.js';
import { t } from '../i18n/t.js';

/**
 * @typedef {object} EmptyStateOpts
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [icon]
 * @property {{ text: string, onClick: () => void, variant?: any }} [action]
 * @property {string} [className]
 */

export function emptyState(opts = {}) {
  const {
    title = t('placeholder.no_data'),
    description = '',
    icon: iconName = 'inbox',
    action = null,
    className = ''
  } = opts;

  const classes = ['empty-state'];
  if (className) classes.push(className);

  const el = h('div', { class: classes.join(' '), role: 'region' });

  if (iconName) {
    el.appendChild(
      icon(iconName, {
        size: '3.5rem',
        className: 'empty-state__icon'
      })
    );
  }

  if (title) {
    el.appendChild(h('h3', { class: 'empty-state__title' }, title));
  }

  if (description) {
    el.appendChild(h('p', { class: 'empty-state__description' }, description));
  }

  if (action) {
    const btn = button({
      text: action.text,
      variant: action.variant || 'primary',
      onClick: action.onClick
    });
    const actionWrap = h('div', { class: 'empty-state__action' }, btn.el);
    el.appendChild(actionWrap);
  }

  return el;
}
