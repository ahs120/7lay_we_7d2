// src/renderer/components/button.js
// Button component with variants, loading state, and accessible hit targets.

import { h, clear } from '../utils/dom.js';
import { icon } from './icon.js';

/**
 * @typedef {object} ButtonOpts
 * @property {string} [text]
 * @property {string} [icon]
 * @property {string} [iconAfter]
 * @property {'primary'|'secondary'|'ghost'|'danger'|'gold'|'outline'} [variant]
 * @property {'sm'|'md'|'lg'} [size]
 * @property {(e: MouseEvent) => void} [onClick]
 * @property {boolean} [disabled]
 * @property {'button'|'submit'|'reset'} [type]
 * @property {string} [ariaLabel]
 * @property {string} [className]
 * @property {string|number} [badge]
 */

/**
 * Create a button element.
 * @param {ButtonOpts} opts
 */
export function button(opts = {}) {
  const {
    text = '',
    icon: iconName = null,
    iconAfter = null,
    variant = 'primary',
    size = 'md',
    onClick = null,
    disabled = false,
    type = 'button',
    ariaLabel = null,
    className = '',
    badge = null
  } = opts;

  let isDisabled = disabled;
  let isLoading = false;
  let currentText = text;

  const btnClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`
  ];
  if (className) btnClasses.push(className);
  if (!text && iconName && !badge) btnClasses.push('btn--icon-only');

  const btnProps = {
    type,
    class: btnClasses.join(' '),
    role: 'button'
  };
  if (isDisabled) btnProps.disabled = '';
  if (ariaLabel) btnProps['aria-label'] = ariaLabel;

  const el = h('button', btnProps);

  function renderContent() {
    clear(el);

    if (isLoading) {
      const spinner = icon('loader-circle', {
        className: 'btn__spinner spin',
        size: '1.25rem'
      });
      el.appendChild(spinner);
    } else if (iconName) {
      el.appendChild(icon(iconName, {
        className: 'btn__icon',
        size: size === 'sm' ? '1.125rem' : '1.25rem'
      }));
    }

    if (currentText) {
      const label = h('span', { class: 'btn__label' }, currentText);
      el.appendChild(label);
    }

    if (!isLoading && iconAfter) {
      el.appendChild(icon(iconAfter, {
        className: 'btn__icon-after',
        size: size === 'sm' ? '1.125rem' : '1.25rem'
      }));
    }

    if (badge !== null && badge !== undefined) {
      const badgeEl = h('span', { class: 'btn__badge num' }, String(badge));
      el.appendChild(badgeEl);
    }
  }

  let clickHandler = null;
  if (onClick) {
    clickHandler = (e) => {
      if (isDisabled || isLoading) {
        e.preventDefault();
        return;
      }
      onClick(e);
    };
    el.addEventListener('click', clickHandler);
  }

  renderContent();

  return {
    el,
    setDisabled(bool) {
      isDisabled = Boolean(bool);
      if (isDisabled) {
        el.setAttribute('disabled', '');
      } else {
        el.removeAttribute('disabled');
      }
    },
    setLoading(bool) {
      isLoading = Boolean(bool);
      if (isLoading) {
        el.setAttribute('aria-busy', 'true');
        el.setAttribute('disabled', '');
      } else {
        el.removeAttribute('aria-busy');
        if (!isDisabled) el.removeAttribute('disabled');
      }
      renderContent();
    },
    setText(str) {
      currentText = str;
      renderContent();
    },
    destroy() {
      if (clickHandler) el.removeEventListener('click', clickHandler);
    }
  };
}
