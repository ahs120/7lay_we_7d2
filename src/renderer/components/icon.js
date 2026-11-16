// src/renderer/components/icon.js
// Icon component — builds SVG from ICONS data via createElementNS.
// No innerHTML, no SVG strings, no external URLs.
// Fallback to circle-help (or a plain circle) if icon not found.

import { ICONS } from '../assets/icons/icons.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create an SVG icon element.
 * @param {string} name — icon name (e.g. 'check', 'x', 'home')
 * @param {object} [opts]
 * @param {string} [opts.size]        — CSS size value, default '1.5rem'
 * @param {string} [opts.className]   — extra CSS classes
 * @param {boolean} [opts.flipRtl]    — flip horizontally in RTL (for directional icons)
 * @param {string} [opts.title]       — accessible title (makes icon non-hidden)
 * @param {string} [opts.color]       — CSS color (default 'currentColor')
 * @param {string} [opts.strokeWidth] — SVG stroke-width (default '2')
 * @returns {SVGElement}
 */
export function icon(name, opts = {}) {
  const {
    size = 'var(--icon-md)',
    className = '',
    flipRtl = false,
    title = null,
    color = 'currentColor',
    strokeWidth = '2',
  } = opts;

  // Resolve icon nodes — fallback to circle-help, then inline circle
  let nodes = ICONS[name];
  if (!nodes) {
    nodes = ICONS['circle-help'];
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', color);
  svg.setAttribute('stroke-width', strokeWidth);
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  // Accessibility
  if (title) {
    const titleEl = document.createElementNS(SVG_NS, 'title');
    titleEl.textContent = title;
    svg.appendChild(titleEl);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', title);
  } else {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  }

  // Size via CSS custom property
  svg.style.setProperty('inline-size', size);
  svg.style.setProperty('block-size', size);
  svg.style.setProperty('flex-shrink', '0');

  // Build class list
  const classes = ['icon'];
  if (flipRtl) classes.push('icon--flip-rtl');
  if (className) classes.push(className);
  svg.setAttribute('class', classes.join(' '));

  // Render nodes
  if (nodes) {
    for (const [tag, attrs] of nodes) {
      const child = document.createElementNS(SVG_NS, tag);
      for (const [attr, val] of Object.entries(attrs)) {
        child.setAttribute(attr, String(val));
      }
      svg.appendChild(child);
    }
  } else {
    // Ultimate fallback: simple circle
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    svg.appendChild(circle);
  }

  return svg;
}
