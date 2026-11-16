// src/renderer/utils/dom.js
// DOM utilities — no innerHTML, no outerHTML, no insertAdjacentHTML.
// All elements built via h() using createElement / createElementNS.

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set(['svg','path','circle','rect','line','polyline','polygon',
  'ellipse','g','defs','use','symbol','text','tspan','textPath',
  'clipPath','mask','pattern','linearGradient','radialGradient','stop',
  'filter','feBlend','feColorMatrix','feComposite','feFlood','feGaussianBlur',
  'feMerge','feMergeNode','feOffset','feTile','feTurbulence']);

const FORBIDDEN_PROPS = new Set(['innerHTML','outerHTML','insertAdjacentHTML','style']);

/**
 * Create a DOM element.
 * @param {string} tag
 * @param {Record<string,any>} [props]
 * @param {...(Node|string|null|undefined|false)} children
 * @returns {Element}
 */
export function h(tag, props, ...children) {
  const el = SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);

  if (props) {
    for (const [key, val] of Object.entries(props)) {
      if (val === null || val === undefined || val === false) continue;

      // Safety: throw on forbidden props
      if (FORBIDDEN_PROPS.has(key)) {
        throw new Error(`h(): forbidden prop "${key}" — use DOM methods instead`);
      }

      if (key === 'class' || key === 'className') {
        if (val) el.setAttribute('class', val);
      } else if (key === 'style' && typeof val === 'object') {
        // val must be a plain object of CSS custom properties or allowed props
        // We set via setProperty to avoid inline style= attribute
        for (const [cssProp, cssVal] of Object.entries(val)) {
          el.style.setProperty(cssProp, cssVal);
        }
      } else if (key.startsWith('data-')) {
        el.setAttribute(key, String(val));
      } else if (key.startsWith('aria-') || key === 'role') {
        el.setAttribute(key, String(val));
      } else if (key === 'for' || key === 'htmlFor') {
        el.setAttribute('for', String(val));
      } else if (key === 'tabIndex' || key === 'tabindex') {
        el.setAttribute('tabindex', String(val));
      } else if (key === 'type' || key === 'name' || key === 'value' || key === 'placeholder'
        || key === 'href' || key === 'src' || key === 'alt' || key === 'title'
        || key === 'id' || key === 'lang' || key === 'dir' || key === 'hidden'
        || key === 'disabled' || key === 'checked' || key === 'selected'
        || key === 'readonly' || key === 'required' || key === 'maxlength'
        || key === 'min' || key === 'max' || key === 'step' || key === 'autocomplete'
        || key === 'spellcheck' || key === 'translate' || key === 'draggable'
        || key === 'contenteditable' || key === 'inputmode'
      ) {
        if (typeof val === 'boolean') {
          if (val) el.setAttribute(key, '');
        } else {
          el.setAttribute(key, String(val));
        }
      } else if (key === 'viewBox' || key === 'xmlns' || key === 'fill' || key === 'stroke'
        || key === 'stroke-width' || key === 'stroke-linecap' || key === 'stroke-linejoin'
        || key === 'd' || key === 'cx' || key === 'cy' || key === 'r'
        || key === 'x' || key === 'y' || key === 'width' || key === 'height'
        || key === 'points' || key === 'x1' || key === 'y1' || key === 'x2' || key === 'y2'
        || key === 'rx' || key === 'ry' || key === 'opacity'
        || key === 'stroke-opacity' || key === 'fill-opacity'
      ) {
        // SVG attributes
        el.setAttribute(key, String(val));
      } else {
        // Generic attribute
        el.setAttribute(key, String(val));
      }
    }
  }

  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    } else if (Array.isArray(child)) {
      for (const c of child) {
        if (c === null || c === undefined || c === false) continue;
        if (typeof c === 'string' || typeof c === 'number') {
          el.appendChild(document.createTextNode(String(c)));
        } else if (c instanceof Node) {
          el.appendChild(c);
        }
      }
    }
  }

  return el;
}

/**
 * Remove all children from an element.
 * @param {Element} el
 */
export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/**
 * Query selector — throws if not found when required=true.
 * @param {string} selector
 * @param {Element|Document} [root]
 * @param {boolean} [required]
 * @returns {Element|null}
 */
export function qs(selector, root = document, required = false) {
  const el = root.querySelector(selector);
  if (required && !el) throw new Error(`qs: element not found: "${selector}"`);
  return el;
}

/**
 * Query selector all — returns Array.
 * @param {string} selector
 * @param {Element|Document} [root]
 * @returns {Element[]}
 */
export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/**
 * Event delegation.
 * @param {Element} root
 * @param {string} eventType
 * @param {string} selector
 * @param {(e: Event, target: Element) => void} handler
 * @returns {() => void} unsubscribe
 */
export function delegate(root, eventType, selector, handler) {
  function listener(e) {
    const target = e.target?.closest(selector);
    if (target && root.contains(target)) {
      handler(e, target);
    }
  }
  root.addEventListener(eventType, listener);
  return () => root.removeEventListener(eventType, listener);
}

/** Generate a unique DOM-safe id. */
let _uidCounter = 0;
export function uid(prefix = 'uid') {
  return `${prefix}-${++_uidCounter}`;
}
