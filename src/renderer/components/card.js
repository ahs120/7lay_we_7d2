// src/renderer/components/card.js
// Surface Card container component.

import { h } from '../utils/dom.js';

/**
 * @typedef {object} CardOpts
 * @property {Node|string} [header]
 * @property {Node|string} [body]
 * @property {Node|string} [footer]
 * @property {(e: MouseEvent) => void} [onClick]
 * @property {string} [className]
 */

export function card(opts = {}) {
  const {
    header = null,
    body = null,
    footer = null,
    onClick = null,
    className = ''
  } = opts;

  const classes = ['card'];
  if (onClick) classes.push('card--clickable');
  if (className) classes.push(className);

  const cardProps = { class: classes.join(' ') };
  if (onClick) {
    cardProps.role = 'button';
    cardProps.tabindex = '0';
  }

  const el = h('div', cardProps);

  if (header) {
    const headEl = h('div', { class: 'card__header' });
    if (typeof header === 'string') headEl.appendChild(h('h3', { class: 'card__title' }, header));
    else headEl.appendChild(header);
    el.appendChild(headEl);
  }

  if (body) {
    const bodyEl = h('div', { class: 'card__body' });
    if (typeof body === 'string') bodyEl.appendChild(document.createTextNode(body));
    else bodyEl.appendChild(body);
    el.appendChild(bodyEl);
  }

  if (footer) {
    const footEl = h('div', { class: 'card__footer' });
    if (typeof footer === 'string') footEl.appendChild(document.createTextNode(footer));
    else footEl.appendChild(footer);
    el.appendChild(footEl);
  }

  if (onClick) {
    el.addEventListener('click', onClick);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(e);
      }
    });
  }

  return el;
}
