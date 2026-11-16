// src/renderer/components/badge.js
// Status badge / tag component.

import { h } from '../utils/dom.js';
import { icon } from './icon.js';

/**
 * @typedef {object} BadgeOpts
 * @property {string} text
 * @property {'neutral'|'success'|'danger'|'warning'|'primary'|'gold'} [variant]
 * @property {string} [icon]
 * @property {'sm'|'md'} [size]
 * @property {string} [className]
 */

export function badge(opts = {}) {
  const {
    text = '',
    variant = 'neutral',
    icon: iconName = null,
    size = 'md',
    className = ''
  } = opts;

  const classes = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`
  ];
  if (className) classes.push(className);

  const el = h('span', { class: classes.join(' ') });

  if (iconName) {
    el.appendChild(icon(iconName, { size: size === 'sm' ? '0.875rem' : '1rem', className: 'badge__icon' }));
  }

  el.appendChild(h('span', { class: 'badge__text' }, text));

  return el;
}
